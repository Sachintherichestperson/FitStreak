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
        continue;
      }

      const challenge = await challengemongo.findById(challengeId);
      if (!challenge) {
        continue;
      }

      const now = new Date();
      const duration = challenge.Duration || 1;
      const scanCount = ChallengeScan || 0;

      if (now >= endDate) {
        const alreadyCompleted = user.ChallengesCompleted.some(
          c => c.challengeId.toString() === challenge._id.toString()
        );

        if (alreadyCompleted) {
          continue;
        }

        if (scanCount >= duration) {
          user.ChallengesCompleted.push({
            challengeId: challenge._id,
            completeDate: now,
            Status: 'Won'
          });

          const alreadyWon = user.challengeWins.some(
            c => c.challengeId.toString() === challenge._id.toString()
          );
          if (!alreadyWon) {
            user.challengeWins.push({
              challengeId: challenge._id,
              WinDate: now
            });
          }

          const alreadyWinner = challenge.ChallengeWinners.some(
            c => c.UserId.toString() === user._id.toString()
          );
          if (!alreadyWinner) {
            challenge.ChallengeWinners.push({
              UserId: user._id,
              WonDate: now
            });
          }

          user.Points += 15;
        } else {

          const alreadyCompleted = user.ChallengesCompleted.some(
          c => c.challengeId.toString() === challenge._id.toString()
        );

        if (alreadyCompleted) {
          continue;
        }

          user.ChallengesCompleted.push({
            challengeId: challenge._id,
            completeDate: now,
            Status: 'Lose'
          });

          const alreadyLosed = user.challengeLosed.some(
            c => c.challengeId.toString() === challenge._id.toString()
          );
          if (!alreadyLosed) {
            user.challengeLosed.push({
              challengeId: challenge._id,
              LoseDate: now
            });
          }

          const alreadyLoser = challenge.ChallengeLosers.some(
            c => c.UserId.toString() === user._id.toString()
          );
          if (!alreadyLoser) {
            challenge.ChallengeLosers.push({
              UserId: user._id,
              LoseDate: now
            });
          }
        }

        await challenge.save();
      }
    }
    await user.save();
  }

}

module.exports = router;