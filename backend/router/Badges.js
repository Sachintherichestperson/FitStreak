const express = require('express');
const router = express.Router();
const Usermongo = require('../models/User-mongo');
const isloggedin = require('../middleware/isloggein');
const Badgesfunc = require('../functions/Badges-func');
const Badgemongo = require('../models/Badgesmongo');
const getDuosRanking = require('../functions/Duo-Ranking');

router.get('/', isloggedin, async (req, res) => {
  try {
    const user = await Usermongo.findById(req.user._id).populate('Badges');
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check and award streak badge
    const badgeInfo = Badgesfunc.getStreakBadge(user.Streak.Scan);
    const nextBadges = Badgesfunc.getNextBadges(user.Streak.Scan);

    const alreadyHasBadge = await Badgemongo.findOne({
      userId: user._id,
      name: badgeInfo.currentBadge.name
    });

    if (!alreadyHasBadge) {
      const newBadge = new Badgemongo({ 
        userId: user._id, 
        name: badgeInfo.currentBadge.name, 
        emoji: badgeInfo.currentBadge.icon, 
        description: badgeInfo.currentBadge.description 
      });
      user.CurrentBadge = newBadge._id;
      await newBadge.save();
    }

    // Check and award special badges
    for (const badge of Badgesfunc.specialbadges) {
      const hasBadge = user.Badges?.some(b => b.name === badge.name);
      if (badge.condition(user) && !hasBadge) {
        const newBadge = new Badgemongo({
          userId: user._id,
          name: badge.name,
          emoji: badge.emoji,
          description: badge.description,
        });
        await newBadge.save();
        user.Badges.push(newBadge._id);
      }
    }

    await user.save();

    const allSpecialBadges = Badgesfunc.specialbadges.map(badge => {
      const hasBadge = user.Badges?.some(b => b.name === badge.name);
      return {
        ...badge,
        earned: hasBadge
      };
    });

    res.json({
      ...badgeInfo,
      nextBadges,
      specialBadges: allSpecialBadges
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get('/Accountability-Buddy', isloggedin, async(req, res) => {
  try {
    const user = await Usermongo.findById(req.user._id).populate('Buddy.BuddyId');
    if (!user) return res.status(404).json({ error: "User not found" });

    const Buddy = user;
    if (!Buddy) return res.status(404).json({ error: "Buddy not found" });

    res.json({
      Buddy
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get('/Duo-Ranking', isloggedin, async(req, res) => {
  try {
    const result = await getDuosRanking();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;