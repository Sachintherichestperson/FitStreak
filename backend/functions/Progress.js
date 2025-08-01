const express = require('express');
const router = express.Router();
const usermongo = require('../models/User-mongo');
const challengemongo = require('../models/Challenge-mongo');

async function NonProof() {
  const users = await usermongo.find();

  for (const user of users) {
    const challenges = user.ActiveChallenge;

    for (const challengeEntry of challenges) {
      const { challengeId, startDate, endDate, ChallengeScan } = challengeEntry;

      if (!challengeId || !startDate || !endDate) {
        console.log(`⚠️ Missing data for challenge in user ${user.username}`);
        continue;
      }

      const challenge = await challengemongo.findById(challengeId);
      if (!challenge) {
        console.log(`❌ Challenge not found: ${challengeId}`);
        continue;
      }

      const now = new Date();
      const duration = challenge.Duration || 1;

      const scanCount = ChallengeScan || 0; // ✅ FIXED: Treat as number

      if (now >= endDate) {
        // ✅ Challenge has ended
        if (scanCount >= duration) {
          user.ChallengesCompleted.push({
            challengeId: challenge._id,
            completeDate: now,
            Status: 'Won'
          });

          user.challengeWins.push({
            challengeId: challenge._id,
            WinDate: now
          });

          user.Points += 15;
        } else {
          user.ChallengesCompleted.push({
            challengeId: challenge._id,
            completeDate: now,
            Status: 'Lose'
          });

          user.challengeLosed.push({
            challengeId: challenge._id,
            LoseDate: now
          });
        }
      }
    }

    await user.save();
  }
}

module.exports = router;
