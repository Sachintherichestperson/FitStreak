const { Expo } = require('expo-server-sdk');
const expo = new Expo();
const Usermongo = require("../models/User-mongo");
const Postmongo = require("../models/post-mongo");


async function sendNotification(token, title, message, data = {}) {
  if (!Expo.isExpoPushToken(token)) {
    console.log('Invalid Expo push token:', token);
    return;
  }

  const messages = [
    {
      to: token,
      sound: 'default',
      title: title,
      body: message,
      data,
    },
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }
    
  } catch (err) {
    console.error('Error sending notification:', err);
  }
}

async function checkAndSendStreakReminders() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    const users = await Usermongo.find({
      NotificationToken: { $exists: true, $ne: null },
      'Streak.CurrentTrack': { $exists: true, $ne: null }
    });

    for (const user of users) {
      await processUserStreakReminder(user, now);
    }

  } catch (error) {
    console.error('Error in checkAndSendStreakReminders:', error);
  }
}

async function processUserStreakReminder(user, currentTime) {
  try {
    const CurrentTrack = user.Streak.CurrentTrack;
    if (!CurrentTrack) return;

    const today = new Date();
    const lastScanDate = new Date(CurrentTrack);
    
    if (isSameDay(today, lastScanDate)) {
      return;
    }

    const reminderTime = new Date(lastScanDate);
    reminderTime.setDate(reminderTime.getDate() + 1);
    reminderTime.setHours(reminderTime.getHours() - 1);
    // console.log(reminderTime);

    if (isSameHour(currentTime, reminderTime)) {
      console.log(currentTime, reminderTime);
      
      const todayKey = getDateKey(currentTime);
      const lastNotificationKey = user.Streak.lastNotificationSent;
      console.log("h",lastNotificationKey);
      
      if (lastNotificationKey !== todayKey) {
        await sendNotification(
          user.NotificationToken,
          "Streak Reminder! 🔥",
          "It’s time to fuck weakness. Don’t forget to scan to maintain your streak.",
          { type: 'streak_reminder', userId: user._id.toString() }
        );

        await Usermongo.findByIdAndUpdate(user._id, {
          $set: {
            'Streak.lastNotificationSent': todayKey
          }
        });

        console.log(`Streak reminder sent to user: ${user.username}`);
      }
    }

  } catch (error) {
    console.error(`Error processing streak reminder for user ${user._id}:`, error);
  }
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function isSameHour(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate() &&
         date1.getHours() === date2.getHours();
}

function getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function setupStreakReminderScheduler() {
  checkAndSendStreakReminders();
}

setInterval(() => {
  setupStreakReminderScheduler();
}, 50 * 1000);

async function Likes() {
  const users = await Usermongo.find().populate("CurrentBadge");

  for (const user of users) {
    if (!user.Anonymous_Post) continue;

    for (const PostId of user.Anonymous_Post) {
      const post = await Postmongo.findById(PostId);

      if (post.Biceps.length === 0) {
        sendNotification(
          user.NotificationToken,
          `Congrats ${user.CurrentBadge.name}`,
          `Your Post: ${post.Content} Got ${post.Biceps.length}`
        );
      }else if (post.Fire.length > 50){
        sendNotification(
          user.NotificationToken,
          "Congrats Legend",
          `Your Post: ${post.Content} Got ${post.Biceps.length}`
        );
      }
    }
  }
}

module.exports = {
  sendNotification,
  checkAndSendStreakReminders,
  processUserStreakReminder,
  setupStreakReminderScheduler
};