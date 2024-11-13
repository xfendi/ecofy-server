const { db } = require('./firebaseConfig'); // Import db from firebaseConfig
const axios = require('axios');

// Function to send notifications to users if an event starts in less than 1 hour
async function sendPushNotification() {
  const currentTime = new Date(); // Current time
  const oneHourLater = new Date(currentTime.getTime() + 60 * 60 * 1000); // One hour from now

  // Format times as "dd.MM.yyyy HH:mm:ss" for comparison with Firestore event date
  const formattedCurrentTime = `${currentTime.getDate().toString().padStart(2, '0')}.${(currentTime.getMonth() + 1).toString().padStart(2, '0')}.${currentTime.getFullYear()} ${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:00`;
  const formattedOneHourLater = `${oneHourLater.getDate().toString().padStart(2, '0')}.${(oneHourLater.getMonth() + 1).toString().padStart(2, '0')}.${oneHourLater.getFullYear()} ${oneHourLater.getHours().toString().padStart(2, '0')}:${oneHourLater.getMinutes().toString().padStart(2, '0')}:00`;

  // Log the query range for debugging purposes
  console.log(`Querying for events with date between ${formattedCurrentTime} and ${formattedOneHourLater}`);

  try {
    // Fetch events starting in less than one hour
    const eventsSnapshot = await db
      .collection('events')
      .where('date', '>=', formattedCurrentTime)
      .where('date', '<', formattedOneHourLater) // Less than 1 hour away
      .get();

    if (eventsSnapshot.empty) {
      console.log('No upcoming events within the next hour.');
      return;
    }

    // Process each event
    for (const doc of eventsSnapshot.docs) {
      const event = doc.data();
      const eventRef = db.collection('events').doc(event.id.toString());

      // Log event details
      console.log(`Processing event "${event.title}" with ID ${event.id} starting at ${event.date}`);

      // Check if notification has already been sent
      const notificationSent = event.notificationSent || false;
      if (notificationSent) {
        console.log(`Notification for event "${event.title}" has already been sent.`);
        continue; // Skip this event
      }

      const users = event.likes || []; // List of user IDs who liked the event

      // Send notification to each user
      for (const userUID of users) {
        try {
          const userDoc = await db.collection('profiles').doc(userUID).get();
          if (!userDoc.exists) {
            console.log(`User with UID ${userUID} does not exist.`);
            continue;
          }

          // Prepare the notification details
          const notificationData = {
            subID: userUID, // Unique user ID
            appId: 24760, // Your app ID
            appToken: 'yWMd08JhWMihJYHlyMV9so', // Your app token
            title: `Event "${event.title}" in less than 1 hour!`,
            message: `Don't forget about "${event.title}", starting soon!`,
          };

          // Log the prepared notification data
          console.log(`Sending notification to user: ${userUID}`, notificationData);

          // Send the push notification via Indie Notify API
          await axios.post('https://app.nativenotify.com/api/indie/notification', notificationData);
          console.log(`Notification sent to user: ${userUID}`);
        } catch (error) {
          console.error(`Error sending notification to user ${userUID}:`, error);
        }
      }

      // Mark the notification as sent for this event
      await eventRef.update({ notificationSent: true });
      console.log(`Notification marked as sent for event: ${event.id}`);
    }
  } catch (error) {
    console.error('Error processing events:', error);
  }
}

// Run the function every 10 minutes
setInterval(sendPushNotification, 600000); // 600,000 milliseconds = 10 minutes
