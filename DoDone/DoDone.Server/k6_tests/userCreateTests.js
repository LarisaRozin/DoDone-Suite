import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load admin credentials from CSV - each virtual user will pick one randomly
const adminCredentials = new SharedArray('admin-credentials', function () {
  return open('./loadtest-credentials.csv')
    .split('\n')
    .slice(1) // Skip header
    .filter(line => line.trim() !== '') // Remove empty lines
    .map(line => {
      const [teamId, teamName, userId, userName, email, firstName, lastName, password] = line.split(',');
      return {
        teamId: parseInt(teamId),
        teamName,
        userId: parseInt(userId),
        userName,
        email,
        firstName,
        lastName,
        password: password ? password.trim() : "LoadTest123!" // Ensure password is properly trimmed and fallback
      };
    });
});

export let options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm up
    { duration: '1m', target: 100 },   // Ramp up to moderate load
    { duration: '3m', target: 200 },   // Peak load
    { duration: '1m', target: 50 },    // Scale down
    { duration: '30s', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests must complete below 3s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
  },
};

const BASE_URL = 'http://localhost:5214';

// Global cache for each VU's authentication data
let vuData = {
  authToken: null,
  adminUser: null,
  initialized: false
};

function getRandomElement(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

// Authenticate and get token for a specific admin user
function authenticateAdmin(adminCredential) {
  const loginPayload = {
    UserName: adminCredential.userName,
    Password: adminCredential.password
  };

  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, 
    JSON.stringify(loginPayload), 
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginResponse.status === 200) {
    const loginData = loginResponse.json();
    return loginData.token;
  } else {
    console.log(`Failed to authenticate admin ${adminCredential.userName} (${adminCredential.email}), status: ${loginResponse.status}`);
    return null;
  }
}

// Initialize authentication data for this VU
function initializeVUData() {
  if (vuData.initialized) return vuData;
  
  // Pick a random admin for this VU
  vuData.adminUser = getRandomElement(adminCredentials);
  if (!vuData.adminUser) {
    console.log('No admin credentials available');
    return vuData;
  }
  
  // Authenticate this admin
  vuData.authToken = authenticateAdmin(vuData.adminUser);
  if (!vuData.authToken) {
    console.log('Failed to authenticate admin');
    return vuData;
  }

  vuData.initialized = true;
  return vuData;
}

// Generate unique user data for each create request
function generateUniqueUser() {
  const timestamp = Date.now();
  const vuId = __VU;
  const iterationId = __ITER;
  const uniqueId = `${timestamp}_${vuId}_${iterationId}`;
  
  return {
    userName: `loadtest_user_${uniqueId}`,
    email: `loadtest_user_${uniqueId}@example.com`,
    firstName: `FirstName${uniqueId}`,
    lastName: `LastName${uniqueId}`,
    password: 'LoadTest123!',
    isActive: true,
    isAdmin: Math.random() > 0.8 // 20% chance of being admin
  };
}

export default function() {
  const data = initializeVUData();
  
  // Skip if initialization failed
  if (!data.authToken) {
    console.log(`VU skipping iteration - no auth token, admin: ${data.adminUser ? data.adminUser.userName : 'N/A'}`);
    sleep(2);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${data.authToken}`,
    'Content-Type': 'application/json',
  };

  // Generate unique user data for each create request
  const userData = generateUniqueUser();
  
  const createUserPayload = {
    UserName: userData.userName,
    Email: userData.email,
    FirstName: userData.firstName,
    LastName: userData.lastName,
    Password: userData.password,
    IsActive: userData.isActive,
    IsAdmin: userData.isAdmin
  };

  // Test: Create new user via admin endpoint
  const createUserResponse = http.post(`${BASE_URL}/api/user`, 
    JSON.stringify(createUserPayload), 
    { headers }
  );

  check(createUserResponse, {
    'user create status is 200': (r) => r.status === 200,
    'user create response time < 4s': (r) => r.timings.duration < 4000,
    'user create returns success': (r) => {
      if (r.status !== 200) return false;
      try {
        const responseData = r.json();
        return responseData && responseData.success === true;
      } catch (e) {
        return false;
      }
    },
    'user create returns user data': (r) => {
      if (r.status !== 200) return false;
      try {
        const responseData = r.json();
        return responseData && responseData.data && responseData.data.email === userData.email;
      } catch (e) {
        return false;
      }
    },
  }, { 
    testType: 'admin_user_create',
    adminTeamId: data.adminUser.teamId.toString(),
    adminEmail: data.adminUser.email,
    adminUserName: data.adminUser.userName,
    createdUserEmail: userData.email,
    createdUserName: userData.userName,
    isAdminUser: userData.isAdmin.toString()
  });

  // Log any errors for debugging
  if (createUserResponse.status !== 200) {
    console.log(`User creation failed by ${data.adminUser.email} for ${userData.email}: Status ${createUserResponse.status}, Body: ${createUserResponse.body}`);
  }

  // Random sleep between requests to simulate realistic user behavior
  sleep(Math.random() * 2 + 0.5); // Random sleep between 0.5-2.5 seconds
}