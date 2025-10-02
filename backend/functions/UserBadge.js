const Usermongo = require('../models/User-mongo');
const Badgesfunc = require('../functions/Badges-func');
const Badgemongo = require('../models/Badgesmongo');

async function UserBadge(userId){

    const user = await Usermongo.findById(userId).populate('Badges');

    if (!user) return res.status(404).json({ error: "User not found" });

    const badgeInfo = Badgesfunc.getStreakBadge(user.Streak.Track);

    const alreadyHasBadge = await Badgemongo.findOne({
      userId: userId,
      name: badgeInfo.currentBadge.name
    });
    let currentBadgeDoc = alreadyHasBadge;
    
    if (!alreadyHasBadge) {
      currentBadgeDoc = new Badgemongo({ 
        userId: userId, 
        name: badgeInfo.currentBadge.name, 
        emoji: badgeInfo.currentBadge.icon, 
        description: badgeInfo.currentBadge.description 
      });
      await currentBadgeDoc.save();
      
      user.Badges.push(currentBadgeDoc._id);
    }

    user.CurrentBadge = currentBadgeDoc._id;

    await user.save();
}

module.exports = UserBadge;