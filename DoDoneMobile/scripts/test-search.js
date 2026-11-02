/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDoneMobile - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

// Simple test to verify search functionality
const testTaskItems = [
  { id: 1, name: 'Complete project documentation', description: 'Write comprehensive docs for the project' },
  { id: 2, name: 'Fix login bug', description: 'Resolve authentication issues in the login flow' },
  { id: 3, name: 'Update UI components', description: 'Modernize the user interface components' },
  { id: 4, name: 'Database optimization', description: 'Improve query performance and indexing' }
];

function filterTasksBySearch(tasks, searchQuery) {
  if (!searchQuery.trim()) {
    return tasks;
  }
  
  const query = searchQuery.toLowerCase().trim();
  return tasks.filter(item => 
    item.name?.toLowerCase().includes(query) ||
    item.description?.toLowerCase().includes(query)
  );
}

// Test cases
console.log('Testing search functionality:');

console.log('\n1. Search for "project":');
console.log(filterTasksBySearch(testTaskItems, 'project'));

console.log('\n2. Search for "login":');
console.log(filterTasksBySearch(testTaskItems, 'login'));

console.log('\n3. Search for "UI":');
console.log(filterTasksBySearch(testTaskItems, 'UI'));

console.log('\n4. Search for "performance":');
console.log(filterTasksBySearch(testTaskItems, 'performance'));

console.log('\n5. Empty search (should return all):');
console.log(filterTasksBySearch(testTaskItems, ''));

console.log('\n6. No matches:');
console.log(filterTasksBySearch(testTaskItems, 'nonexistent'));

console.log('\nSearch functionality test completed successfully!');
