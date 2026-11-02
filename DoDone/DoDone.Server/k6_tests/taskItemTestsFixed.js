import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 5 },   // Warm up
    { duration: '3m', target: 15 },  // Ramp up to moderate load
    { duration: '5m', target: 25 },  // Peak load
    { duration: '2m', target: 10 },  // Scale down
    { duration: '1m', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests must complete below 3s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
  },
};

const BASE_URL = 'http://localhost:5214';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjUxNCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJrNmxvYWR0ZXN0MkBleGFtcGxlLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Ims2bG9hZHRlc3QyQGV4YW1wbGUuY29tIiwiRmlyc3ROYW1lIjoiTG9hZFRlc3QiLCJMYXN0TmFtZSI6IlVzZXIiLCJUZWFtSWQiOiIyNTAiLCJJc0FkbWluIjoiVHJ1ZSIsImp0aSI6ImIwODY5NjMxLTg3NDEtNGMwZS04NjQzLTVmODZhZWJlZDM2NSIsImlhdCI6MTc2MjYzNjk0OCwiZXhwIjoxNzYyNzQxMzQ4LCJpc3MiOiJEb0RvbmVBcHAiLCJhdWQiOiJEb0RvbmVVc2VycyJ9.M4FPc0cIzMIh8JeGrEAj6Ly3M7sFmA_deIcq1cFNcyI';

// Global variables to store actual data ranges
let dataRanges = null;

// Function to get actual data ranges from the database via API
function getDataRanges() {
  if (dataRanges) return dataRanges;
  
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };
  
  // Query for a sample of tasks to understand the data structure
  const sampleResponse = http.post(`${BASE_URL}/api/taskitem/paged-list`, 
    JSON.stringify({
      pageNumber: 1,
      pageSize: 100,
      searchTerm: 'Load Test'
    }), 
    { headers }
  );
  
  if (sampleResponse.status === 200) {
    const sampleData = sampleResponse.json(); 
    const tasks = sampleData.data || [];
    
    if (tasks.length > 0) {
      // Extract actual ranges from the sample data
      const teamIds = [...new Set(tasks.map(t => t.teamId).filter(id => id))];
      const userIds = [...new Set(tasks.flatMap(t => [t.assignedTo, t.createdBy]).filter(id => id))];
      const intervalIds = [...new Set(tasks.map(t => t.teamAllowanceIntervalId).filter(id => id))];
      
      dataRanges = {
        teamIds: teamIds.length > 0 ? teamIds : [250], // Fallback to known team ID
        userIds: userIds.length > 0 ? userIds : [514], // Fallback to token user ID
        intervalIds: intervalIds.length > 0 ? intervalIds : [] // Use empty array if none found
      };
      
      console.log('Data ranges detected:', JSON.stringify(dataRanges));
    }
  }
  
  // Fallback ranges if API call fails
  if (!dataRanges) {
    dataRanges = {
      teamIds: [250], // From JWT token
      userIds: [514], // From JWT token  
      intervalIds: [] // Will avoid using intervals if none detected
    };
    console.log('Using fallback data ranges');
  }
  
  return dataRanges;
}

function getRandomElement(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

export function setup() {
  // Initialize data ranges once at the start
  return getDataRanges();
}

export default function(data) {
  const ranges = data || getDataRanges();
  
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Paged List with allowance interval functionality
  let pagedListRequest = {
    pageNumber: Math.floor(Math.random() * 3) + 1,
    pageSize: [10, 25, 50][Math.floor(Math.random() * 3)],
    searchTerm: Math.random() > 0.7 ? 'Load Test' : null,
    assignmentStatusFilter: ['Any', 'Assigned', 'Unassigned'][Math.floor(Math.random() * 3)],
    completionStatusFilter: ['Any', 'InProgress', 'Completed'][Math.floor(Math.random() * 3)],
    activeStatusFilter: ['Any', 'Active', 'Inactive'][Math.floor(Math.random() * 3)],
    bonusStatusFilter: ['Any', 'WithBonus', 'WithoutBonus'][Math.floor(Math.random() * 3)]
  };
  
  // Add allowance interval if we have valid intervals
  if (ranges.intervalIds.length > 0 && Math.random() > 0.5) {
    pagedListRequest.allowanceIntervalId = getRandomElement(ranges.intervalIds);
  }
  
  let pagedListResponse = http.post(`${BASE_URL}/api/taskitem/paged-list`, 
    JSON.stringify(pagedListRequest), 
    { headers }
  );
  
  check(pagedListResponse, {
    'paged list status is 200': (r) => r.status === 200,
    'paged list response time < 3s': (r) => r.timings.duration < 3000,
    'paged list has data': (r) => {
      if (r.status !== 200) return false;
      try {
        const data = r.json();
        return data && data.data !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  // Test 2: Paged List Details with team member filtering
  let pagedDetailsRequest = {
    pageNumber: 1,
    pageSize: 20,
    archivedStatusFilter: ['Any', 'NotArchived'][Math.floor(Math.random() * 2)],
    dueStatusFilter: ['Any', 'Due', 'NotDue'][Math.floor(Math.random() * 3)]
  };
  
  // Add team member filter if we have valid user IDs
  if (ranges.userIds.length > 0 && Math.random() > 0.6) {
    pagedDetailsRequest.teamMemberId = getRandomElement(ranges.userIds);
  }
  
  let pagedDetailsResponse = http.post(`${BASE_URL}/api/taskitem/paged-list-details`,
    JSON.stringify(pagedDetailsRequest),
    { headers }
  );

  check(pagedDetailsResponse, {
    'paged details status is 200': (r) => r.status === 200,
    'paged details response time < 4s': (r) => r.timings.duration < 4000,
    'paged details has stats': (r) => {
      if (r.status !== 200) return false;
      try {
        const data = r.json();
        return data && data.stats !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  // Test 3: Individual Task Item Details
  if (Math.random() > 0.7) {
    // Use a more realistic task ID range based on our load test data
    let taskId = Math.floor(Math.random() * 10000) + 1;
    let taskDetailsResponse = http.get(`${BASE_URL}/api/taskitem/${taskId}`, { headers });
    
    check(taskDetailsResponse, {
      'task details status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'task details response time < 1s': (r) => r.timings.duration < 1000,
    });
  }

  // Test 4: Bulk Operations
  if (Math.random() > 0.9) {
    let bulkTaskIds = [];
    for (let i = 0; i < 3; i++) { // Smaller batch size
      bulkTaskIds.push(Math.floor(Math.random() * 10000) + 1);
    }
    
    let bulkArchiveResponse = http.post(
      `${BASE_URL}/api/taskitem/archive-list/true`,
      JSON.stringify(bulkTaskIds),
      { headers }
    );
    
    check(bulkArchiveResponse, {
      'bulk archive status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'bulk archive response time < 5s': (r) => r.timings.duration < 5000,
    });
  }

  // Test 5: Complex search with allowance intervals
  if (Math.random() > 0.8) {
    let complexSearchRequest = {
      pageNumber: 1,
      pageSize: 25,
      searchTerm: 'Load Test',
      completionStatusFilter: 'InProgress',
      activeStatusFilter: 'Active'
    };
    
    // Add allowance interval and team member if available
    if (ranges.intervalIds.length > 0) {
      complexSearchRequest.allowanceIntervalId = getRandomElement(ranges.intervalIds);
    }
    if (ranges.userIds.length > 0) {
      complexSearchRequest.teamMemberId = getRandomElement(ranges.userIds);
    }
    
    let searchResponse = http.post(`${BASE_URL}/api/taskitem/paged-list`, 
      JSON.stringify(complexSearchRequest), 
      { headers }
    );
    
    check(searchResponse, {
      'complex search status is 200': (r) => r.status === 200,
      'complex search response time < 4s': (r) => r.timings.duration < 4000,
    });
  }

  sleep(Math.random() * 2 + 0.5);
}