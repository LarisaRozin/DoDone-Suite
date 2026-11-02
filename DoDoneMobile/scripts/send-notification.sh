#!/bin/bash

# Manual iOS Notification Sender
# Use this to send individual notifications or test specific scenarios

SIMULATOR_NAME="iPhone 17 Pro Max"
BUNDLE_ID="com.larisarozin.dodone"

# Function to send a single notification
send_notification() {
    local title="$1"
    local subtitle="$2"
    local badge="$3"
    
    cat > /tmp/notification.json << EOF
{
  "Simulator Target Bundle": "${BUNDLE_ID}",
  "aps": {
    "alert": {
      "title": "${title}",
      "subtitle": "${subtitle}",
      "body": ""
    },
    "badge": ${badge},
    "sound": "default"
  },
  "type": "manual_test"
}
EOF

    echo "📬 Sending: ${title}"
    xcrun simctl push "${SIMULATOR_NAME}" "${BUNDLE_ID}" /tmp/notification.json
    rm /tmp/notification.json
}

# Check command line arguments
case "${1}" in
    "credits")
        send_notification "Task Credits As..." "Garage Sale: task credits assigned: 2 by Ella Miller" 1
        ;;
    "group")
        send_notification "Task Group Ch..." "Garage Sale: task group changed to Household" 2
        ;;
    "created")
        send_notification "Task Created" "New task created by Ella Miller: Garage Sale" 3
        ;;
    "bonus")
        send_notification "Bonus Claimed" "Ella Miller claimed bonus New Bike 🚴 for task 'Readi..." 4
        ;;
    "completed")
        send_notification "Task Completed" "Reading Assignment was completed by Ella Miller" 5
        ;;
    "comment")
        send_notification "New Task Comment" "Ella Miller commented on task 'Grocery shopping': Get milk" 6
        ;;
    "all")
        send_notification "Task Credits As..." "Garage Sale: task credits assigned: 2 by Ella Miller" 1
        sleep 1
        send_notification "Task Group Ch..." "Garage Sale: task group changed to Household" 2
        sleep 1
        send_notification "Task Created" "New task created by Ella Miller: Garage Sale" 3
        sleep 1
        send_notification "Bonus Claimed" "Ella Miller claimed bonus New Bike 🚴 for task 'Readi..." 4
        sleep 1
        send_notification "Task Completed" "Reading Assignment was completed by Ella Miller" 5
        sleep 1
        send_notification "New Task Comment" "Ella Miller commented on task 'Grocery shopping': Get milk" 6
        ;;
    "clear")
        echo "🧹 Clearing notifications..."
        xcrun simctl push "${SIMULATOR_NAME}" com.apple.springboard clear 2>/dev/null || echo "ℹ️  Notifications cleared (or were already empty)"
        ;;
    *)
        echo "📱 iOS Notification Sender"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  credits    - Send task credits notification"
        echo "  group      - Send task group change notification"
        echo "  created    - Send task created notification"
        echo "  bonus      - Send bonus claimed notification"
        echo "  completed  - Send task completed notification"
        echo "  comment    - Send task comment notification"
        echo "  all        - Send all notifications (with delays)"
        echo "  clear      - Clear existing notifications"
        echo ""
        echo "Examples:"
        echo "  $0 all       # Send all notifications"
        echo "  $0 credits   # Send just the credits notification"
        echo "  $0 clear     # Clear all notifications"
        ;;
esac