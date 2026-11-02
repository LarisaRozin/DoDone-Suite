import { SharedArray } from 'k6/data';
import { open } from 'k6';

// Simple test to debug CSV parsing
const testData = new SharedArray('test-credentials', function () {
  return open('./loadtest-credentials.csv')
    .split('\n')
    .slice(1, 3) // Just first 2 data lines
    .filter(line => line.trim() !== '')
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
        password
      };
    });
});

export default function () {
  try {
    console.log(`Total test records: ${testData.length}`);
    if (testData.length > 0) {
      const firstRecord = testData[0];
      console.log(`First record - UserName: "${firstRecord.userName}", Password: "${firstRecord.password}"`);
      console.log(`Password length: ${firstRecord.password ? firstRecord.password.length : 'undefined'}`);
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}