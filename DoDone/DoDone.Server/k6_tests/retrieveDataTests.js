import http from 'k6/http';
import { check, group, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 2 },   // Warm up - get valid data
    // { duration: '2m', target: 15 },   // Ramp up to moderate load
    // { duration: '3m', target: 25 },   // Peak load for updates
    // { duration: '1m', target: 10 },   // Scale down
    // { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests must complete below 5s (higher threshold for updates)
    http_req_failed: ['rate<0.10'],    // Error rate must be below 10% (higher threshold for complex operations)
  },
};

const BASE_URL = 'http://localhost:5214';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjYxNSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJrNmxvYWR0ZXN0MkBleGFtcGxlLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Ims2bG9hZHRlc3QyQGV4YW1wbGUuY29tIiwiRmlyc3ROYW1lIjoiTG9hZFRlc3QiLCJMYXN0TmFtZSI6IlVzZXIiLCJUZWFtSWQiOiIyNzEiLCJJc0FkbWluIjoiVHJ1ZSIsImp0aSI6Ijk1Y2EwMTQ0LWI0NGItNDZlNC04NmEwLTNjMzVmN2Q3ZDE3MSIsImlhdCI6MTc2Mjc4MzcyNCwiZXhwIjoxNzYyODg4MTI0LCJpc3MiOiJEb0RvbmVBcHAiLCJhdWQiOiJEb0RvbmVVc2VycyJ9.udLr19b0RE3XBwG_upPspZTbK1ngYI3AMZW10YMTqPA';

// Global cache for valid data retrieved from the API
let validData = {
  grades: [],
  initialized: false
};

// Function to retrieve valid data for updates
function initializeValidData() {
  if (validData.initialized) return validData;
  
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export function setup() {
  return initializeValidData();
}

export default function(data) {

  // Get valid grades (static lookup data)
  const gradeResponse = http.get(`${BASE_URL}/api/grade/list`, { headers });
  if (gradeResponse.status === 200) {
    const gradeData = gradeResponse.json();
    if (gradeData && Array.isArray(gradeData)) {
      validData.grades = gradeData.map(grade => ({
        id: grade.id,
      }));
    }
  }
  
  // Skip if we don't have grades
  if (!validData.grades || validData.grades.length === 0) {
    console.log('No valid grades found, skipping iteration');
    sleep(1);
    return;
  }

  // Check the results with different expectations based on update type
  const expectedMaxTime = 2000; // Default threshold for retrieve data tests

  check(updateResponse, {
    'update status is 200': (r) => r.status === 200,
    [`update response time < ${expectedMaxTime}ms (${testType})`]: (r) => r.timings.duration < expectedMaxTime,
    'update returns task data': (r) => {
      if (r.status !== 200) return false;
      try {
        const data = r.json();
        return data && data.id === taskToUpdate.id;
      } catch (e) {
        return false;
      }
    },
  }, { testType: testType }); // Tag with test type for analysis

  // For recalculation updates, also test that subsequent reads are fast
  if (isRecalculationUpdate && updateResponse.status === 200) {
    // Test immediate read after update (tests if calculations completed)
    const readResponse = http.get(`${BASE_URL}/api/taskitem/${taskToUpdate.id}`, { headers });
    
    check(readResponse, {
      'post-update read status is 200': (r) => r.status === 200,
      'post-update read response time < 1s': (r) => r.timings.duration < 1000,
    }, { testType: `${testType}_followup_read` });

    // Test if allowance stats are still fast after recalculation
    if (Math.random() > 0.7) { // 30% of recalculation updates
      const statsResponse = http.post(`${BASE_URL}/api/taskitem/paged-list-details`,
        JSON.stringify({
          pageNumber: 1,
          pageSize: 10,
          teamMemberId: taskToUpdate.assignedTo
        }),
        { headers }
      );
      
      check(statsResponse, {
        'post-update stats status is 200': (r) => r.status === 200,
        'post-update stats response time < 3s': (r) => r.timings.duration < 3000,
      }, { testType: `${testType}_stats_impact` });
    }
  }

  // Vary sleep time based on update complexity
  const sleepTime = isRecalculationUpdate ? 
    Math.random() * 1.5 + 1.0 :     // 1-2.5s for recalculation updates
    Math.random() * 1.0 + 0.5;      // 0.5-1.5s for basic updates
    
  sleep(sleepTime);
}