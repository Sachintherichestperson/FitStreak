const { Expo } = require('expo-server-sdk');
const expo = new Expo();
const mongoose = require('mongoose');
const Usermongo = require("../models/User-mongo");
const Postmongo = require("../models/post-mongo");
const cron = require('node-cron');

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
    // console.log(lastScanDate);
    
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

setInterval(() => {
  Post();
}, 3 * 60*  60 * 1000);


async function Post() {
  const posts = await Postmongo.find();
  for (const post of posts){
    await seedFakeReactions(post._id)
  }
}

async function CommentsNotification() {
  const posts = await Postmongo.find().populate("User");
  const milestones = [10, 21, 25, 31, 35, 45];

  for (const post of posts) {
    for (const milestone of milestones) {
      // If post reached a milestone but notification not yet sent for it
      if (post.Comment.length >= milestone && !post.CommentMilestones.includes(milestone)) {
        await sendNotification(
          post.User.NotificationToken,
          "You are in Trend, Buddy!!",
          `Your Post Got ${post.Comment.length} Comments! 🎉`
        );

        // Record that this milestone was achieved
        post.CommentMilestones.push(milestone);
        await post.save();
      }
    }
  }
}

async function LikesNotification() {
  const posts = await Postmongo.find().populate("User");

  // define milestone thresholds
  const fireMilestones = [10, 16, 23, 33, 45, 50];
  const bicepsMilestones = [5, 13, 25, 37, 48, 60];

  for (const post of posts) {
    if (!post.User?.NotificationToken) continue;

    // Fire milestone check
    for (const milestone of fireMilestones) {
      if (post.Fire.length >= milestone && !post.FireMilestonesSent.includes(milestone)) {
        await sendNotification(
          post.User.NotificationToken,
          "Your post is on fire! 🔥",
          `Your Post Got ${post.Fire.length} Fire`
        );
        post.FireMilestonesSent.push(milestone);
        await post.save();
      }
    }

    // Biceps milestone check
    for (const milestone of bicepsMilestones) {
      if (post.Biceps.length >= milestone && !post.BicepsMilestonesSent.includes(milestone)) {
        await sendNotification(
          post.User.NotificationToken,
          "Your post is getting stronger! 💪",
          `Your Post Got ${post.Biceps.length} Biceps`
        );
        post.BicepsMilestonesSent.push(milestone);
        await post.save();
      }
    }
  }
}

async function FakeViewsMilestoneNotification() {
  const posts = await Postmongo.find().populate("User");

  const baseMilestones = [20, 35, 50, 80, 150, 210, 240];

  for (const post of posts) {
    if (!post.User?.NotificationToken) continue;

    // pick a milestone randomly from baseMilestones
    const milestone = baseMilestones[Math.floor(Math.random() * baseMilestones.length)];

    // check if this milestone was already sent for this post
    if (post.SentViewMilestones.includes(milestone)) continue;

    // add a small random fuzz to make it look natural
    const randomFuzz = Math.floor(Math.random() * 5); // 0–4
    const fakeViews = milestone + randomFuzz;

    const emoji = ["🔥", "👀", "📈", "💥"][Math.floor(Math.random() * 4)];

    await sendNotification(
      post.User.NotificationToken,
      "Your Post is Trending!",
      `Your post got ${fakeViews} views ${emoji}`
    );

    // mark milestone as sent
    post.SentViewMilestones.push(milestone);
    await post.save();
  }
}


cron.schedule('0 12 * * *', async () => {
  try {
    console.log("Running milestone notifications at 12:00 PM");
    await LikesNotification();
    await CommentsNotification();
    await FakeViewsMilestoneNotification();
  } catch (err) {
    console.error("Error running notifications:", err);
  }
}, { timezone: "Asia/Kolkata" });


cron.schedule('0 18 * * *', async () => {
  try {
    console.log("Running milestone notifications at 6:00 PM");
    await LikesNotification();
    await CommentsNotification();
    await FakeViewsMilestoneNotification();
  } catch (err) {
    console.error("Error running notifications:", err);
  }
}, { timezone: "Asia/Kolkata" });


cron.schedule('0 22 * * *', async () => {
  try {
    console.log("Running milestone notifications at 10:00 PM");
    await LikesNotification();
    await CommentsNotification();
    await FakeViewsMilestoneNotification();
  } catch (err) {
    console.error("Error running notifications:", err);
  }
}, { timezone: "Asia/Kolkata" });



function generateFakeObjectId() {
    return new mongoose.Types.ObjectId();
}

async function seedFakeReactions(postId) {
    try {
        const bicepsCount = Math.floor(Math.random() * 11) + 10;
        const fireCount = Math.floor(Math.random() * 11) + 10;

        const bicepsUsers = Array.from({ length: bicepsCount }, () => generateFakeObjectId());
        const fireUsers = Array.from({ length: fireCount }, () => generateFakeObjectId());

        await Postmongo.findByIdAndUpdate(postId, {
            $addToSet: {
                Biceps: { $each: bicepsUsers },
                Fire: { $each: fireUsers }
            }
        });

        console.log(`Post ${postId} seeded with fake reactions!`);
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
  sendNotification,
  checkAndSendStreakReminders,
  processUserStreakReminder,
  setupStreakReminderScheduler
};