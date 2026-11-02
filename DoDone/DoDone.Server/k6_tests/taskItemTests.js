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
    { duration: '1m', target: 790 },   // Warm up
    { duration: '3m', target: 1005 },  // Ramp up to moderate load
    { duration: '5m', target: 2000 },  // Peak load
    { duration: '2m', target: 860 },  // Scale down
    { duration: '1m', target: 0 },   // Cool down
  ],
  // stages: [
  //   { duration: '1m', target: 290 },   // Warm up
  //   { duration: '3m', target: 605 },  // Ramp up to moderate load
  //   { duration: '5m', target: 1000 },  // Peak load
  //   { duration: '2m', target: 160 },  // Scale down
  //   { duration: '1m', target: 0 },   // Cool down
  // ],
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
  teamUsers: [],
  taskItems: [],
  intervals: [],
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

// Get team users for the admin's team
function getTeamUsers(authToken, teamId) {
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  // Use the correct API endpoint with PagedListRequest
  const pagedListRequest = {
    Paging: {
      Page: 1,
      PageSize: 100, // Get all team members
    },
    Filtering: {
      SearchTerm: ""
    },
    Sorting: {
      SortBy: "",
      SortDirection: 0 // Ascending=0
    }
  };

  const teamResponse = http.post(`${BASE_URL}/api/team/members`, JSON.stringify(pagedListRequest), { headers });
  
  if (teamResponse.status === 200) {
    const teamData = teamResponse.json();
    
    // The correct response structure has data array directly
    if (teamData && teamData.data && Array.isArray(teamData.data)) {
      return teamData.data.filter(user => user.isActive);
    }
  }
  
  console.log(`Failed to get team users for team ${teamId}, status: ${teamResponse.status}, body: ${teamResponse.body}`);
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
  
  const headers = {
    'Authorization': `Bearer ${vuData.authToken}`,
    'Content-Type': 'application/json',
  };

  // Get team users
  vuData.teamUsers = getTeamUsers(vuData.authToken, vuData.adminUser.teamId);

  // Get task items for this team
  const taskResponse = http.post(`${BASE_URL}/api/taskitem/paged-list-details`, 
    JSON.stringify({
      Paging: {
        Page: 1,
        PageSize: 200, // Get more tasks per team
      },
      TaskItemFiltering: {
        SearchTerm: 'Load Test',
        ActiveFilter: 1 // Active=1
      },
      TeamAllowanceIntervalId: 0 // All intervals
    }), 
    { headers }
  );

  if (taskResponse.status === 200) {
    const taskData = taskResponse.json();
    if (taskData && taskData.data) {
      vuData.taskItems = taskData.data;
    }

    // Extract unique interval IDs from this team's tasks
    const intervalIds = new Set();
    taskData.data.forEach(task => {
      if (task.teamAllowanceIntervalId) intervalIds.add(task.teamAllowanceIntervalId);
    });
    vuData.intervals = Array.from(intervalIds);
    vuData.intervals.push(0);  // all intervals
    vuData.intervals.push(-1); // no interval
    vuData.intervals.push(-2); // all tasks
    vuData.intervals.push(-3); // private tasks
  }
  else {
    console.log(`Failed to retrieve task items for team ${vuData.adminUser.teamId}, status: ${taskResponse.status}`);
  }

  vuData.initialized = true;
  
  return vuData;
}

export default function() {
  const data = initializeVUData();
  
  // Skip if initialization failed
  if (!data.authToken) {
    console.log(`VU skipping iteration - no auth token, user: ${data.adminUser ? data.adminUser.userName : 'N/A'}`);
    sleep(2);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${data.authToken}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Paged List Details (tests TaskItemStats calculation)  
  let pagedDetailsResponse = http.post(`${BASE_URL}/api/taskitem/paged-list-details`,
    JSON.stringify({
      paging: {
        page: 1,
        pageSize: 20,
      },
      taskItemFiltering: {
        // Use team member from the authenticated user's team
        assignedTo: Math.random() > 0.8 && data.teamUsers.length > 0 ? getRandomElement(data.teamUsers).id : null,
        archivedFilter: [0, 2][Math.floor(Math.random() * 2)], // Any=0, Unarchived=2
        // dueFilter: [0, 1, 2][Math.floor(Math.random() * 3)], // Any=0, Due=1, NotDue=2
      },
      teamAllowanceIntervalId: Math.random() > 0.5 && data.intervals.length > 0 ? getRandomElement(data.intervals) : 0
    }),
    { headers }
  );

  check(pagedDetailsResponse, {
    'paged details status is 200': (r) => r.status === 200,
    'paged details response time < 4s': (r) => r.timings.duration < 4000,
    'paged details has stats': (r) => r.json() && r.json().stats,
  }, { 
    teamId: data.adminUser.teamId.toString(),
    adminEmail: data.adminUser.email,
    adminUserName: data.adminUser.userName
  });

  // Test 2: Individual Task Item Details
  // if (Math.random() > 0.7 && data.taskItems && data.taskItems.length > 0) { // 30% of requests
  //   const taskItem = getRandomElement(data.taskItems);
  //   let taskDetailsResponse = http.get(`${BASE_URL}/api/taskitem/${taskItem.id}`, { headers });
    
  //   check(taskDetailsResponse, {
  //     'task details status is 200': (r) => r.status === 200,
  //     'task details response time < 1s': (r) => r.timings.duration < 1000,
  //     'task details returns correct task': (r) => {
  //       if (r.status !== 200) return false;
  //       try {
  //         const taskData = r.json();
  //         return taskData && taskData.data && taskData.data.id === taskItem.id;
  //       } catch (e) {
  //         return false;
  //       }
  //     },
  //   }, { 
  //     testType: 'individual_task_details',
  //     teamId: data.adminUser.teamId.toString(),
  //     adminEmail: data.adminUser.email
  //   });
  // }

  // //  Test 3: Bulk Operations (testing performance under write load)
  // if (Math.random() > 0.9 && data.taskItems && data.taskItems.length >= 5) { // 10% of requests do bulk operations
  //   // Get 5 random task IDs from this team's tasks
  //   let bulkTaskIds = [];
  //   for (let i = 0; i < Math.min(5, data.taskItems.length); i++) {
  //     const taskItem = getRandomElement(data.taskItems);
  //     if (taskItem && !bulkTaskIds.includes(taskItem.id)) {
  //       bulkTaskIds.push(taskItem.id);
  //     }
  //   }
    
  //   let boolValues = [true, false];
  //   if (bulkTaskIds.length > 0) {
  //     let bulkActiveResponse = http.post(
  //       `${BASE_URL}/api/taskitem/set-active-list/${boolValues[Math.floor(Math.random() * boolValues.length)]}`,
  //       JSON.stringify(bulkTaskIds),
  //       { headers }
  //     );
      
  //     check(bulkActiveResponse, {
  //       'bulk archive status is 200': (r) => r.status === 200,
  //       'bulk archive response time < 5s': (r) => r.timings.duration < 5000,
  //     }, { 
  //       testType: 'bulk_archive',
  //       teamId: data.adminUser.teamId.toString(),
  //       adminEmail: data.adminUser.email,
  //       bulkCount: bulkTaskIds.length.toString()
  //     });
  //   }
  // }

  // // Test 4: Search with complex filters (tests index performance)
  if (Math.random() > 0.9) { // 10% of requests (reduced frequency)
    let searchResponse = http.post(`${BASE_URL}/api/taskitem/paged-list-details`, 
      JSON.stringify({
        paging: {
          page: 1,
          pageSize: 25,
        },
        taskItemFiltering: {
          // SearchTerm: 'Load Test',
          // Use team member from authenticated user's team
          assignedTo: Math.random() > 0.5 && data.teamUsers.length > 0 ? getRandomElement(data.teamUsers).id : null,
          completionFilter: [0, 1, 2][Math.floor(Math.random() * 3)], // Any=0, Completed=1, InProgress=2
          activeFilter: [0, 1, 2][Math.floor(Math.random() * 3)], // Any=0, Active=1, Inactive=2
        },
        teamAllowanceIntervalId: Math.random() > 0.5 && data.intervals.length > 0 ? getRandomElement(data.intervals) : 0,
      }), 
      { headers }
    );
    
    check(searchResponse, {
      'complex search status is 200': (r) => r.status === 200,
      'complex search response time < 4s': (r) => r.timings.duration < 4000,
      'complex search has results': (r) => {
        if (r.status !== 200) return false;
        try {
          const searchData = r.json();
          return searchData && searchData.data !== undefined; // May be empty array, that's ok
        } catch (e) {
          return false;
        }
      },
    }, { 
      testType: 'complex_search',
      teamId: data.adminUser.teamId.toString(),
      adminEmail: data.adminUser.email
    });
  }

  sleep(Math.random() * 2 + 0.5); // Random sleep between 0.5-2.5 seconds
}

