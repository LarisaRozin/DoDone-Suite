import http, { get } from 'k6/http';
import { check, sleep } from 'k6';

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
    http_req_failed: ['rate<0.00'],    // Error rate must be below 0%
  },
};

const BASE_URL = 'http://localhost:5214';


function getRandomElement(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

// Generate unique user data for each request
function generateUniqueUser() {
  const timestamp = Date.now();
  const vuId = __VU;
  const iterationId = __ITER;
  const uniqueId = `${timestamp}_${vuId}_${iterationId}`;
  
  let boolValues = [true, false];
  let platformValues = ['android', 'ios', 'web'];
  let timezoneValues = ['UTC', 'PST', 'EST', 'IST'];
  return {
    userName: `ltreg_${uniqueId}`,
    email: `ltreg_${uniqueId}@example.com`,
    // email: `larisarozin@gmail.com`,
    firstName: `ltreg${uniqueId}`,
    lastName: `ltreg${uniqueId}`,
    password: 'LoadTest123!',
    teamName: `ltregTeam_${uniqueId}`,
    isBusiness: getRandomElement(boolValues),
    deviceId: `ltregdevice_${uniqueId}`,
    platform: getRandomElement(platformValues),
    timezone: getRandomElement(timezoneValues),
  };
}

export default function() {
  // Generate unique user data for each registration attempt
  const userData = generateUniqueUser();
  
  const registerPayload = {
    userName: userData.userName,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    password: userData.password,
    teamName: userData.teamName,
    isBusiness: userData.isBusiness,
    deviceId: userData.deviceId,
    platform: userData.platform,
    timezone: userData.timezone,
  };

  // Test: Register new user
  const registerResponse = http.post(`${BASE_URL}/api/auth/register`, 
    JSON.stringify(registerPayload), 
    { 
      headers: { 
        'Content-Type': 'application/json' 
      } 
    }
  );

  check(registerResponse, {
    'register status is 200': (r) => r.status === 200,
    'register response time < 3s': (r) => r.timings.duration < 3000,
    // 'register returns token': (r) => {
    //   if (r.status !== 200) return false;
    //   try {
    //     const responseData = r.json();
    //     return responseData && responseData.token && responseData.token.length > 0;
    //   } catch (e) {
    //     return false;
    //   }
    // },
    // 'register returns user data': (r) => {
    //   if (r.status !== 200) return false;
    //   try {
    //     const responseData = r.json();
    //     return responseData && responseData.user && responseData.user.email === userData.email;
    //   } catch (e) {
    //     return false;
    //   }
    // },
  }, { 
    testType: 'user_registration',
    email: userData.email,
    userName: userData.userName
  });

  // Log any errors for debugging
  if (registerResponse.status !== 200) {
    console.log(`Registration failed for ${userData.email}: Status ${registerResponse.status}, Body: ${registerResponse.body}`);
  }

  // Random sleep between requests to simulate realistic user behavior
  sleep(Math.random() * 2 + 0.5); // Random sleep between 0.5-2.5 seconds
}