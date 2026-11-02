import http from 'k6/http';
import { check, group, sleep } from 'k6';
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
    { duration: '1m', target: 90 },   // Warm up
    { duration: '3m', target: 205 },  // Ramp up to moderate load
    { duration: '5m', target: 400 },  // Peak load
    { duration: '2m', target: 160 },  // Scale down
    { duration: '1m', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2500'], // 95% of requests must complete below 2.5s
    http_req_failed: ['rate<0.01'],    // Error rate must be below 1%
  },
};

const BASE_URL = 'http://localhost:5214';

// Global cache for each VU's valid data
let vuData = {
  authToken: null,
  adminUser: null,
  taskItems: [],
  teamUsers: [],
  grades: [],
  credits: [1, 2, 3, 4, 5],
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
    pageNumber: 1,
    pageSize: 100, // Get all team members
    searchTerm: "",
    sortBy: "",
    sortDirection: "asc"
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
  
//   console.log(`VU initializing with admin: ${vuData.adminUser.userName} (${vuData.adminUser.email}) - Team: ${vuData.adminUser.teamName}`);
  
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
//   console.log(`Found ${vuData.teamUsers.length} team users`);

  // Get task items for this team
  const taskResponse = http.post(`${BASE_URL}/api/taskitem/paged-list-details`, 
    JSON.stringify({
      pageNumber: 1,
      pageSize: 200, // Get more tasks per team
      searchTerm: 'Load Test',
      activeStatusFilter: 'Active'
    }), 
    { headers }
  );

  if (taskResponse.status === 200) {
    const taskData = taskResponse.json();
    if (taskData && taskData.data) {
      vuData.taskItems = taskData.data.map(task => ({
        id: task.id,
        teamId: task.teamId,
        assignedTo: task.assignedTo,
        createdBy: task.createdBy,
        teamAllowanceIntervalId: task.teamAllowanceIntervalId,
        gradeId: task.gradeId,
        credits: task.credits,
        description: task.description,
        percentComplete: task.percentComplete,
        groupId: task.groupId,
        kindId: task.kindId,
        categoryId: task.categoryId,
        maxBonus: task.maxBonus,
        dueAt: task.dueAt,
        startAt: task.startAt,  
        endAt: task.endAt,
        isComplete: task.isComplete,
        isPinned: task.isPinned,
        isArchived: task.isArchived,
        isPrivate: task.isPrivate,
        priority: task.priority,
        completedBy: task.completedBy,
        completedAt: task.completedAt,
        assignedBy: task.assignedBy,
        assignedAt: task.assignedAt,
        gradedAt: task.gradedAt,
        gradedBy: task.gradedBy,
        activeAt: task.activeAt,
        activeBy: task.activeBy,
        archivedAt: task.archivedAt,
        archivedBy: task.archivedBy,
        name: task.name,
        isActive: task.isActive,
      }));
      
      // Extract unique interval IDs from this team's tasks
      const intervalIds = new Set();
      taskData.data.forEach(task => {
        if (task.teamAllowanceIntervalId) intervalIds.add(task.teamAllowanceIntervalId);
      });
      vuData.intervals = Array.from(intervalIds);
    }
  }
  else {
    console.log(`Failed to retrieve task items for team ${vuData.adminUser.teamId}, status: ${taskResponse.status}`);
  }

  // Get valid grades (static lookup data)
  const gradeResponse = http.get(`${BASE_URL}/api/grade/list/`, { headers });
  if (gradeResponse.status === 200) {
    const gradeData = gradeResponse.json();
    if (gradeData && gradeData.data && Array.isArray(gradeData.data)) {
      vuData.grades = gradeData.data.map(grade => ({ id: grade.id }));
    }
  }

  vuData.initialized = true;
//   console.log(`VU data initialized: ${vuData.taskItems.length} tasks, ${vuData.teamUsers.length} users, ${vuData.grades.length} grades, ${vuData.intervals.length} intervals`);
  
  return vuData;
}

export default function() {
  const data = initializeVUData();
  
  // Skip if initialization failed
  if (!data.authToken || !data.taskItems || data.taskItems.length === 0) {
    console.log(`VU skipping iteration - no valid data (token: ${!!data.authToken}, tasks: ${data.taskItems?.length || 0}), user: ${data.adminUser ? data.adminUser.userName : 'N/A'}`);
    sleep(2);
    return;
  }

  // Skip if we don't have grades
  if (!data.grades || data.grades.length === 0) {
    console.log('No valid grades found, skipping iteration');
    sleep(1);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${data.authToken}`,
    'Content-Type': 'application/json',
  };

  // Select a random task from this team to update
  const taskToUpdate = getRandomElement(data.taskItems);
  if (!taskToUpdate) {
    sleep(1);
    return;
  }

  // Create update payload
  let updatePayload = {
    id: taskToUpdate.id,
    name: taskToUpdate.name,
    description: taskToUpdate.description,
    isActive: taskToUpdate.isActive,
    percentComplete: taskToUpdate.percentComplete,
    credits: taskToUpdate.credits,
    gradeId: taskToUpdate.gradeId,
    assignedTo: taskToUpdate.assignedTo,
    createdBy: taskToUpdate.createdBy,
    teamAllowanceIntervalId: taskToUpdate.teamAllowanceIntervalId,
    teamId: taskToUpdate.teamId,
    groupId: taskToUpdate.groupId,
    kindId: taskToUpdate.kindId,
    categoryId: taskToUpdate.categoryId,
    maxBonus: taskToUpdate.maxBonus,
    dueAt: taskToUpdate.dueAt,
    startAt: taskToUpdate.startAt,
    endAt: taskToUpdate.endAt,
    isComplete: taskToUpdate.isComplete,
    isPinned: taskToUpdate.isPinned,
    isArchived: false,
    isPrivate: false,
    priority: taskToUpdate.priority,
    completedBy: taskToUpdate.completedBy,
    completedAt: taskToUpdate.completedAt,
    assignedBy: taskToUpdate.assignedBy,
    assignedAt: taskToUpdate.assignedAt,
    gradedAt: taskToUpdate.gradedAt,
    gradedBy: taskToUpdate.gradedBy,
    activeAt: taskToUpdate.activeAt,
    archivedAt: taskToUpdate.archivedAt,
    archivedBy: taskToUpdate.archivedBy,
  };

  let testType = 'basic_update';

  // 40% chance: Update Credits and Grade (triggers allowance recalculation)
  if (Math.random() > 0.6 && data.grades.length > 0) {
    const newGrade = getRandomElement(data.grades);
    const newCredits = getRandomElement(data.credits);
    updatePayload.gradeId = newGrade.id;
    updatePayload.gradedAt = new Date().toISOString();
    updatePayload.gradedBy = data.adminUser.userId; // Admin user doing the grading
    updatePayload.credits = newCredits;
    testType = 'grade_credits_update';
  }
  
  // 30% chance: Update AssignedTo to different team member (triggers allowance recalculation) 
  else if (Math.random() > 0.7 && data.teamUsers.length > 1) {
    const newAssignee = getRandomElement(data.teamUsers.filter(u => u.id !== taskToUpdate.assignedTo));
    if (newAssignee) {
      updatePayload.assignedTo = newAssignee.id;
      updatePayload.assignedBy = data.adminUser.userId; // Admin doing the assignment
      updatePayload.assignedAt = new Date().toISOString();
      testType = 'assignment_update';
    }
  }
  
  // 20% chance: Update TeamAllowanceIntervalId (triggers allowance recalculation)
  else if (Math.random() > 0.8 && data.intervals.length > 1) {
    const newInterval = getRandomElement(data.intervals.filter(i => i !== taskToUpdate.teamAllowanceIntervalId));
    if (newInterval) {
      updatePayload.teamAllowanceIntervalId = newInterval;
      testType = 'interval_update';
    }
  }
  
  // Perform the update
  const updateResponse = http.put(`${BASE_URL}/api/taskitem/`, 
    JSON.stringify(updatePayload), 
    { headers }
  );

  // Check the results with different expectations based on update type
  const isRecalculationUpdate = ['grade_credits_update', 'assignment_update', 'interval_update'].includes(testType);
  const expectedMaxTime = isRecalculationUpdate ? 5000 : 3000; // Higher threshold for recalculation updates

  check(updateResponse, {
    'update status is 200': (r) => r.status === 200,
    [`update response time < ${expectedMaxTime}ms (${testType})`]: (r) => r.timings.duration < expectedMaxTime,
    'update returns task data': (r) => {
      if (r.status !== 200) return false;
      try {
        const data = r.json();
        return data && data.data.id === taskToUpdate.id;
      } catch (e) {
        return false;
      }
    },
  }, { 
    testType: testType,
    teamId: data.adminUser.teamId.toString(),
    adminEmail: data.adminUser.email,
    adminUserName: data.adminUser.userName
  });

  if (updateResponse.status !== 200) {
    console.log(`Update failed for task ID ${taskToUpdate.id} in team ${data.adminUser.teamId}, status: ${updateResponse.status}, response: ${updateResponse.body}`);
  }

//   // For recalculation updates, also test that subsequent reads are fast
//   if (isRecalculationUpdate && updateResponse.status === 200) {
//     // Test immediate read after update
//     const readResponse = http.get(`${BASE_URL}/api/taskitem/${taskToUpdate.id}`, { headers });
    
//     check(readResponse, {
//       'post-update read status is 200': (r) => r.status === 200,
//       'post-update read response time < 1s': (r) => r.timings.duration < 1000,
//     }, { testType: `${testType}_followup_read` });

//     // Test if team stats are still fast after recalculation (30% of recalculation updates)
//     if (Math.random() > 0.7) {
//       const statsResponse = http.post(`${BASE_URL}/api/taskitem/paged-list-details`,
//         JSON.stringify({
//           pageNumber: 1,
//           pageSize: 10,
//           teamMemberId: taskToUpdate.assignedTo
//         }),
//         { headers }
//       );
      
//       check(statsResponse, {
//         'post-update stats status is 200': (r) => r.status === 200,
//         'post-update stats response time < 3s': (r) => r.timings.duration < 3000,
//       }, { testType: `${testType}_stats_impact` });
//     }
//   }

  // Vary sleep time based on update complexity
  const sleepTime = isRecalculationUpdate ? 
    Math.random() * 1.5 + 1.0 :     // 1-2.5s for recalculation updates
    Math.random() * 1.0 + 0.5;      // 0.5-1.5s for basic updates
    
  sleep(sleepTime);
}