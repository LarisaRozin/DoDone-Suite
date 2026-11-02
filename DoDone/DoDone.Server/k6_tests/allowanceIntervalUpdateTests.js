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
    { duration: '30s', target: 30 },   // Warm up
    { duration: '1m', target: 60 },    // Ramp up to moderate load
    { duration: '3m', target: 120 },   // Peak load
    { duration: '1m', target: 30 },    // Scale down
    { duration: '30s', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests must complete below 3s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
  },
};

const BASE_URL = 'http://localhost:5214';

// Global cache for each VU's valid data
let vuData = {
  authToken: null,
  adminUser: null,
  allowanceIntervals: [],
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

// Get allowance intervals for the team
function getAllowanceIntervals(authToken) {
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  const intervalResponse = http.get(`${BASE_URL}/api/team/allowance-intervals`, { headers });
  
  if (intervalResponse.status === 200) {
    const intervalData = intervalResponse.json();
    
    if (intervalData && intervalData.allowanceIntervals && Array.isArray(intervalData.allowanceIntervals)) {
      return intervalData.allowanceIntervals;
    }
  }
  
  console.log(`Failed to get allowance intervals, status: ${intervalResponse.status}, body: ${intervalResponse.body}`);
  return [];
}

// Initialize data for this VU
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
  
  // Get allowance intervals for this team
  vuData.allowanceIntervals = getAllowanceIntervals(vuData.authToken);

  vuData.initialized = true;
  return vuData;
}

// Generate updated allowance interval data
function generateUpdateData(existingInterval) {
  const timestamp = Date.now();
  const vuId = __VU;
  const iterationId = __ITER;
  
  let minCreditsOptions = [2, 5, 10, 12, 16, 20];
  let intervalTypes = [1, 2, 3]; // 1=Weekly, 2=Monthly, 3=Quarterly
  let intervalValues = [1, 2, 3, 4, 5, 6];
  let startDayOfWeekOptions = [0, 1, 2, 3, 4, 5, 6]; // Sunday=0 to Saturday=6
  return {
    id: existingInterval.id,
    teamId: existingInterval.teamId,
    name: `${existingInterval.name}_Updated_${timestamp}_${vuId}_${iterationId}`,
    description: existingInterval.description ? `${existingInterval.description} - Updated ${new Date().toISOString()}` : `Updated description ${timestamp}`,
    isActive: Math.random() > 0.2, // 80% chance of keeping active
    maxAllowanceAmount: existingInterval.maxAllowanceAmount + 10, 
    minCreditsForAllowance: getRandomElement(minCreditsOptions),
    intervalType: getRandomElement(intervalTypes),
    intervalValue: getRandomElement(intervalValues),
    startDayOfWeek: getRandomElement(startDayOfWeekOptions),
    // createdBy: existingInterval.createdBy,
    // createdAt: existingInterval.createdAt,
    // updatedBy: existingInterval.updatedBy,
    // updatedAt: new Date().toISOString(),
  };
}

export default function() {
  const data = initializeVUData();
  
  // Skip if initialization failed
  if (!data.authToken) {
    console.log(`VU skipping iteration - no auth token, user: ${data.adminUser ? data.adminUser.userName : 'N/A'}`);
    sleep(2);
    return;
  }

  // Skip if no allowance intervals available
  if (!data.allowanceIntervals || data.allowanceIntervals.length === 0) {
    console.log(`VU skipping iteration - no allowance intervals available for team ${data.adminUser.teamId}`);
    sleep(2);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${data.authToken}`,
    'Content-Type': 'application/json',
  };

  // Pick a random allowance interval to update
  const existingInterval = getRandomElement(data.allowanceIntervals);
  const updateData = generateUpdateData(existingInterval);
  
//   const updatePayload = {
//     id: updateData.id,
//     name: updateData.name,
//     Description: updateData.description,
//     StartDate: updateData.startDate,
//     EndDate: updateData.endDate,
//     AllowanceAmount: updateData.allowanceAmount,
//     IsActive: updateData.isActive,
//     BonusMultiplier: updateData.bonusMultiplier
//   };

  // Test: Update allowance interval
  const updateResponse = http.put(`${BASE_URL}/api/team/allowance-intervals`, 
    JSON.stringify(updateData), 
    { headers }
  );

  check(updateResponse, {
    'allowance interval update status is 200': (r) => r.status === 200,
    'allowance interval update response time < 4s': (r) => r.timings.duration < 4000,
    'allowance interval update returns data': (r) => {
      if (r.status !== 200) return false;
      try {
        const responseData = r.json();
        return responseData && responseData.id === updateData.id;
      } catch (e) {
        return false;
      }
    },
    'allowance interval update reflects changes': (r) => {
      if (r.status !== 200) return false;
      try {
        const responseData = r.json();
        return responseData && responseData.name === updateData.name;
      } catch (e) {
        return false;
      }
    },
  }, { 
    testType: 'allowance_interval_update',
    // adminTeamId: data.adminUser.teamId.toString(),
    // adminEmail: data.adminUser.email,
    // adminUserName: data.adminUser.userName,
    // intervalId: updateData.id.toString(),
    // intervalName: updateData.name,
    // allowanceAmount: updateData.allowanceAmount.toString(),
    // isActive: updateData.isActive.toString()
  });

  // Log any errors for debugging
  if (updateResponse.status !== 200) {
    console.log(`Allowance interval update failed by ${data.adminUser.email} for interval ${updateData.id}: Status ${updateResponse.status}, Body: ${updateResponse.body}`);
  }

  // Random sleep between requests to simulate realistic user behavior
  sleep(Math.random() * 2 + 0.5); // Random sleep between 0.5-2.5 seconds
}