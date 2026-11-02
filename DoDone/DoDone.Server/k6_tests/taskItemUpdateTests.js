import http from 'k6/http';
import { check, group, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 5 },   // Warm up - get valid data
    { duration: '2m', target: 15 },   // Ramp up to moderate load
    { duration: '3m', target: 25 },   // Peak load for updates
    { duration: '1m', target: 10 },   // Scale down
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests must complete below 5s (higher threshold for updates)
    http_req_failed: ['rate<0.10'],    // Error rate must be below 10% (higher threshold for complex operations)
  },
};

const BASE_URL = 'http://localhost:5214';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjYxNSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJrNmxvYWR0ZXN0MkBleGFtcGxlLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Ims2bG9hZHRlc3QyQGV4YW1wbGUuY29tIiwiRmlyc3ROYW1lIjoiTG9hZFRlc3QiLCJMYXN0TmFtZSI6IlVzZXIiLCJUZWFtSWQiOiIyNzEiLCJJc0FkbWluIjoiVHJ1ZSIsImp0aSI6IjI5OGQ0MTI5LTg1OWMtNGMyYS04ZDhjLWU1MGZmZWEyZTc0MCIsImlhdCI6MTc2MzMwNzUzNywiZXhwIjoxNzYzNDExOTM3LCJpc3MiOiJEb0RvbmVBcHAiLCJhdWQiOiJEb0RvbmVVc2VycyJ9.2ZD64ZzT12NTjzagfR2xzQ53_YHyWBYZrnY90i-Iok0';

// Global cache for valid data retrieved from the API
let validData = {
  taskItems: [],
  users: [],
  grades: [],
  credits: [1, 2, 3, 4, 5],
  intervals: [],
  initialized: false
};

function getRandomElement(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

// Function to retrieve valid data for updates
function initializeValidData() {
  if (validData.initialized) return validData;
  
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  console.log('Initializing valid data for updates...');

  // Get valid task items with load test data
  const taskResponse = http.post(`${BASE_URL}/api/taskitem/paged-list-details`, 
    JSON.stringify({
      pageNumber: 1,
      pageSize: 100,
      searchTerm: 'Load Test',
      activeStatusFilter: 'Active'
    }), 
    { headers }
  );

  if (taskResponse.status === 200) {
    const taskData = taskResponse.json();
    if (taskData && taskData.data) {
      validData.taskItems = taskData.data.map(task => ({
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
      
      // Extract unique user IDs from task data
      const userIds = new Set();
      taskData.data.forEach(task => {
        if (task.assignedTo && !userIds.has(task.assignedTo)) userIds.add(task.assignedTo);
        if (task.createdBy && !userIds.has(task.createdBy)) userIds.add(task.createdBy);
      });
      validData.users = Array.from(userIds);
      
      // Extract unique interval IDs
      const intervalIds = new Set();
      taskData.data.forEach(task => {
        if (task.teamAllowanceIntervalId) intervalIds.add(task.teamAllowanceIntervalId);
      });
      validData.intervals = Array.from(intervalIds);
    }
  }
  else {
    console.log('Failed to retrieve task items, status:', taskResponse.status);
  }

  // Get valid grades (static lookup data)
  const gradeResponse = http.get(`${BASE_URL}/api/grade/list/`, { headers });
  if (gradeResponse.status === 200) {
    const gradeData = gradeResponse.json();
    // console.log('Grade data retrieved:', JSON.stringify(gradeData));
    if (gradeData && gradeData.data && Array.isArray(gradeData.data)) {
    //   console.log('Grades found:', gradeData.data.length);
      validData.grades = gradeData.data.map(grade => ({
        id: grade.id,
      }));
    }
    else {
      console.log('Grade data is not an array:', typeof gradeData);
    }
  }
  else {
    console.log('Failed to retrieve grades, status:', gradeResponse.status);
  }

  validData.initialized = true;
  console.log(`Initialized data: ${validData.taskItems.length} tasks, ${validData.users.length} users, ${validData.grades.length} grades, ${validData.intervals.length} intervals`);
  
  return validData;
}

export function setup() {
  return initializeValidData();
}

export default function(data) {
  const validData = data || initializeValidData();
  
  // Skip if we don't have grades
  if (!validData.grades || validData.grades.length === 0) {
    console.log('No valid grades found, skipping iteration');
    sleep(1);
    return;
  }


  // Skip if we don't have enough valid data
  if (!validData.taskItems || validData.taskItems.length === 0) {
    console.log('No valid task items found, skipping iteration');
    sleep(1);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Select a random task to update
  const taskToUpdate = getRandomElement(validData.taskItems);
  if (!taskToUpdate) {
    sleep(1);
    return;
  }

  // Create update payload - focus on fields that trigger allowance recalculations
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

  // 40% chance: Update Credits (triggers allowance recalculation)
  if (Math.random() > 0.6 && validData.grades.length > 0) {
    const newGrade = getRandomElement(validData.grades);
    const newCredits = getRandomElement(validData.credits);
    const newAssignee = getRandomElement(validData.users);
    const newAssignedBy  = getRandomElement(validData.users);
    updatePayload.gradeId = newGrade.id;
    updatePayload.gradedAt = new Date().toISOString();
    updatePayload.credits = newCredits;
    updatePayload.assignedTo = newAssignee;
    updatePayload.assignedBy = newAssignedBy;
    updatePayload.assignedAt = new Date().toISOString();
    testType = 'grade_credits_update';
  }
  
  // 30% chance: Update AssignedTo (triggers allowance recalculation) 
  else if (Math.random() > 0.7 && validData.users.length > 0) {
    const newAssignee = getRandomElement(validData.users);
    const newAssignedBy  = getRandomElement(validData.users);
    updatePayload.assignedTo = newAssignee;
    updatePayload.assignedBy = newAssignedBy;
    updatePayload.assignedAt = new Date().toISOString();
    testType = 'assignment_update';
  }
  
  // 20% chance: Update TeamAllowanceIntervalId (triggers allowance recalculation)
  else if (Math.random() > 0.8 && validData.intervals.length > 0) {
    const newInterval = getRandomElement(validData.intervals);
    updatePayload.teamAllowanceIntervalId = newInterval;
    testType = 'interval_update';
  }
  
  // Perform the update
  const updateResponse = http.put(`${BASE_URL}/api/taskitem/`, 
    JSON.stringify(updatePayload), 
    { headers }
  );

  // Check the results with different expectations based on update type
  const isRecalculationUpdate = ['grade_credits_update', 'assignment_update', 'interval_update', 'multi_field_update'].includes(testType);
  const expectedMaxTime = isRecalculationUpdate ? 5000 : 2000; // Higher threshold for recalculation updates

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
  }, { testType: testType }); // Tag with test type for analysis

  if (updateResponse.status !== 200) {
    console.log(`Update failed for task ID ${taskToUpdate.id}, status: ${updateResponse.status}, response: ${updateResponse.body}`);
  }

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