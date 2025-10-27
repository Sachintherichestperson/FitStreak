const usermongo = require('../models/User-mongo');
const Badgemongo = require('../models/Badgesmongo');

const badges = [
  { minStreak: 0, name: "The Ant", icon: "Ant", isImage: true, description: "A start with determination" },
  { minStreak: 5, name: "The Beetle", icon: "Bettle", isImage: true, description: "Hard-shelled and persistent" },
  { minStreak: 9, name: "The Fish", icon: "Fish", isImage: true, description: "A beginner with big dreams" },
  { minStreak: 12, name: "The Frog", icon: "Frog", isImage: true, description: "Jumping into habit" },
  { minStreak: 15, name: "The Squirrel", icon: "Squirrel", isImage: true, description: "Building consistency" },
  { minStreak: 19, name: "The Cat", icon: "Cat", isImage: true, description: "Graceful and agile" },
  { minStreak: 22, name: "The Dog", icon: "Dog", isImage: true, description: "Loyal companion" },
  { minStreak: 29, name: "The Fox", icon: "Fox", isImage: true, description: "Clever strategist" },
  { minStreak: 38, name: "The Owl", icon: "Owl", isImage: true, description: "Wise and aware" },
  { minStreak: 45, name: "The Goat", icon: "Goat", isImage: true, description: "Steady climber" },
  { minStreak: 51, name: "The Bison", icon: "Bison", isImage: true, description: "Solid foundation" },
  { minStreak: 60, name: "The Rhino", icon: "Rhino", isImage: true, description: "Unstoppable" },
  { minStreak: 68, name: "The Horse", icon: "Horse", isImage: true, description: "Endurance master" },
  { minStreak: 71, name: "The Bear", icon: "Bear", isImage: true, description: "Powerful force" },
  { minStreak: 78, name: "The Wolf", icon: "Wolf", isImage: true, description: "Strong in pack" },
  { minStreak: 82, name: "The Panther", icon: "Panther", isImage: true, description: "Stealthy elegance" },
  { minStreak: 87, name: "The Tiger", icon: "Tiger", isImage: true, description: "Fierce focus" },
  { minStreak: 92, name: "The Lion", icon: "Lion", isImage: true, description: "King of habits" },
  { minStreak: 96, name: "The Shark", icon: "Shark", isImage: true, description: "Always moving" },
  { minStreak: 100, name: "The Falcon", icon: "Falcon", isImage: true, description: "High-flying" },
  { minStreak: 111, name: "The Elephant", icon: "Elephant", isImage: true, description: "Massive strength" },
  { minStreak: 116, name: "The Beast", icon: "Beast", isImage: true, description: "Raw power" },
  { minStreak: 121, name: "The Griffin", icon: "Griffin", isImage: true, description: "Strength + vision" },
  { minStreak: 126, name: "The Dragon", icon: "Dragon", isImage: true, description: "Mythical power" },
  { minStreak: 131, name: "The Phoenix", icon: "Phoenix", isImage: true, description: "Reborn stronger" },
  { minStreak: 137, name: "The Titan", icon: "mountain", description: "Giant dedication" },
  { minStreak: 142, name: "The Emperor", icon: "Crown", isImage: true, description: "Ruler of habits" },
  { minStreak: 152, name: "The FitGod", icon: "atom", description: "Transcendent mastery" }
];

function getStreakBadge(userStreak) {
  let badge = badges[0];
  let nextBadge = null;
  
  for (let i = 0; i < badges.length; i++) {
    if (userStreak >= badges[i].minStreak) {
      badge = badges[i];
      if (i < badges.length - 1) {
        nextBadge = badges[i + 1];
      }
    } else {
      if (!nextBadge) {
        nextBadge = badges[i];
      }
      break;
    }
  }
  
  return {
    currentBadge: badge,
    nextBadge: nextBadge,
    progress: nextBadge ? Math.min(100, Math.round((userStreak / nextBadge.minStreak) * 100)) : 100,
    streak: userStreak
  };
}

function getNextBadges(userStreak) {
  let nextBadges = [];
  let foundCurrent = false;
  
  for (let i = 0; i < badges.length; i++) {
    if (userStreak >= badges[i].minStreak) {
      continue;
    }
    
    if (!foundCurrent || nextBadges.length < 4) {
      nextBadges.push(badges[i]);
      foundCurrent = true;
    }
    
    if (nextBadges.length >= 4) {
      break;
    }
  }
  
  return nextBadges;
}

const specialbadges = [
  { name: "Streak Hero", emoji: "🏆", description: "Completed a 30-day streak without breaking.", type: "special", instruction: '30-day Streak without breaking', condition: user => user.Streak?.Track >= 30 },
  { name: "Challenge King", emoji: "👑", description: "Conquered 5 challenges like a pro.", type: "special", instruction: 'Win 5 challenges', condition: user => user.challengeWins?.length >= 5 },
  { name: "Daily Beast", emoji: "💪", description: "Logged 7 days in a row.", type: "special", instruction: 'Login for 7 Days', condition: user => user.loginStreak >= 7 },
  { name: "Your First Post", emoji: "📸", description: "Uploaded your first post.", type: "special", instruction: 'Upload First Post', condition: user => user.Anonymous_Post?.length >= 1 },
  { name: "Top Reactor", emoji: "🧠", description: "Posted 100+ Reactor.", type: "special", instruction: 'React 100+ Times', condition: user => user.Reactions >= 100 },
  { name: "Steps Master", emoji: "🏃‍♂️", description: "Walked 10,000 steps.", type: "special", instruction: 'Walk 10k steps', condition: user => user.totalSteps >= 10000 },
  { name: "BPM Master", emoji: "🎶", description: "Completed 10,000 BPMs.", type: "special", instruction: 'Maintain Good BPM', condition: user => user.totalBPM >= 10000 },
];

async function getSpecialBadges() {
  const users = await usermongo.find().lean();
  
  const allBadgeRecords = await Badgemongo.find({}).lean();

  const badgeAssignments = [];

  for (const user of users) {
    const userBadgeNames = allBadgeRecords
      .filter(b => b.userId.toString() === user._id.toString())
      .map(b => b.name);

    for (const badge of specialbadges) {
      if (badge.condition(user) && !userBadgeNames.includes(badge.name)) {
        const newBadge = new Badgemongo({
          userId: user._id,
          name: badge.name,
          emoji: badge.emoji,
          description: badge.description,
        });

        badgeAssignments.push(newBadge.save());

        await usermongo.updateOne(
          { _id: user._id },
          { $addToSet: { Badges: newBadge._id } }
        );
      }
    }
  }

  await Promise.all(badgeAssignments);
}



module.exports = { 
  getStreakBadge,
  getNextBadges,
  getSpecialBadges,
  specialbadges
};
