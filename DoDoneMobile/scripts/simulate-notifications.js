#!/usr/bin/env node

/**
 * iOS Notification Simulation Script
 * This script sends multiple test notifications to simulate the notification list
 * shown in your screenshot for iOS screenshots.
 */

const { execSync } = require('child_process');
const path = require('path');

// Configuration
const APP_BUNDLE_ID = 'com.larisarozin.dodone';
const SIMULATOR_NAME = 'iPhone Air'; // Adjust based on your simulator

// Notification templates matching your screenshot
const NOTIFICATIONS = [
  {
    title: 'Task Credits As...',
    subtitle: 'Garage Sale: task credits assigned: 2 by Ella Miller',
    time: '10:16 AM',
    delay: 0
  },
  {
    title: 'Task Group Ch...',
    subtitle: 'Garage Sale: task group changed to Household',
    time: '10:13 AM',
    delay: 1000
  },
  {
    title: 'Task Created',
    subtitle: 'New task created by Ella Miller: Garage Sale',
    time: '10:10 AM',
    delay: 2000
  },
  {
    title: 'Bonus Claimed',
    subtitle: 'Ella Miller claimed bonus New Bike 🚴 for task \'Readi...',
    time: '10:09 AM',
    delay: 3000
  },
  {
    title: 'Task Completed',
    subtitle: 'Reading Assignment was completed by Ella Miller',
    time: '10:08 AM',
    delay: 4000
  },
  {
    title: 'New Task Comment',
    subtitle: 'Ella Miller commented on task \'Grocery shopping\': Get milk',
    time: '10:03 AM',
    delay: 5000
  }
];

/**
 * Send a notification using xcrun simctl
 */
function sendNotification(notification, index) {
  const notificationPayload = {
    "Simulator Target Bundle": APP_BUNDLE_ID,
    "aps": {
      "alert": {
        "title": notification.title,
        "subtitle": notification.subtitle,
        "body": ""
      },
      "badge": index + 1,
      "sound": "default"
    },
    "taskId": `task_${index + 1}`,
    "type": "test_notification"
  };

  // Write payload to temporary file
  const payloadFile = `/tmp/notification_${index}.json`;
  require('fs').writeFileSync(payloadFile, JSON.stringify(notificationPayload, null, 2));

  try {
    const command = `xcrun simctl push "${SIMULATOR_NAME}" "${APP_BUNDLE_ID}" "${payloadFile}"`;
    console.log(`Sending notification ${index + 1}: ${notification.title}`);
    execSync(command, { stdio: 'inherit' });
    
    // Clean up temporary file
    require('fs').unlinkSync(payloadFile);
  } catch (error) {
    console.error(`Failed to send notification ${index + 1}:`, error.message);
  }
}

/**
 * Main function to send all notifications with delays
 */
async function main() {
  console.log('🚀 Starting iOS notification simulation...');
  console.log(`📱 Target: ${SIMULATOR_NAME}`);
  console.log(`📦 Bundle ID: ${APP_BUNDLE_ID}`);
  console.log(`📬 Sending ${NOTIFICATIONS.length} notifications with delays...\n`);

  // Send notifications with delays to stack them up
  for (let i = 0; i < NOTIFICATIONS.length; i++) {
    const notification = NOTIFICATIONS[i];
    
    setTimeout(() => {
      sendNotification(notification, i);
    }, notification.delay);
  }

  console.log('\n✅ All notifications queued!');
  console.log('\n📋 To capture the notification list:');
  console.log('1. Wait for all notifications to arrive (about 6 seconds)');
  console.log('2. Swipe down from the top of the simulator to open Notification Center');
  console.log('3. Take your screenshot');
  console.log('\n💡 Tip: You can also manually send notifications using the "Device > Push Notification" menu in Simulator');
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
iOS Notification Simulation Script

Usage:
  node simulate-notifications.js [options]

Options:
  --help, -h     Show this help message
  --single       Send only one test notification
  --clear        Clear all notifications first

Examples:
  node simulate-notifications.js              # Send all notifications
  node simulate-notifications.js --single     # Send one test notification
  node simulate-notifications.js --clear      # Clear existing notifications first
    `);
    process.exit(0);
  }

  if (args.includes('--clear')) {
    try {
      console.log('🧹 Clearing existing notifications...');
      execSync(`xcrun simctl push "${SIMULATOR_NAME}" com.apple.springboard clear`);
      console.log('✅ Notifications cleared');
    } catch (error) {
      console.log('ℹ️  Could not clear notifications (this is normal)');
    }
  }

  if (args.includes('--single')) {
    console.log('📬 Sending single test notification...');
    sendNotification(NOTIFICATIONS[0], 0);
  } else {
    main();
  }
}

module.exports = { sendNotification, NOTIFICATIONS };