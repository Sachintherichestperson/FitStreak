const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const usermongo = require('../models/User-mongo');
const ExcelJS = require("exceljs");
const { sendNotification } = require("../functions/Notification");
const Proofmongo = require("../models/Proofmongo");
const fs = require("fs");
const path = require("path");
const challengemongo = require('../models/Challenge-mongo');

async function NonProof() {
  const users = await usermongo.find();

  for (const user of users) {
    const challenges = user.ActiveChallenge;

    for (const challengeEntry of challenges) {
      const { challengeId, startDate, endDate, ChallengeScan } = challengeEntry;

      if (!challengeId || !startDate || !endDate) continue;
      
      const challenge = await challengemongo.findById(challengeId);
      if (!challenge || challenge.Challenge_Type !== "Non-Proof") continue; // Only Non-Proof

      const now = new Date();
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      if (now < endOfDay) continue;

      
      const duration = challenge.Duration || 1;
      const scanCount = ChallengeScan || 0;

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

          await sendNotification(
              user.NotificationToken,
              "🎉 Congratulations, Hero! 🐦‍🔥",
              `You won the "${challenge.Title}" challenge! 15 points have been added to your account, and your reward will be processed within 2 days. Keep up the great work!`
          );

          user.Points += 15;
        } else {
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
          await sendNotification(
              user.NotificationToken,
              "Challenge Completed!",
              `You didn't win the "${challenge.Title}" challenge this time. Don't worry—keep going, and you'll crush it next time! 💪`
          );
        }

        await challenge.save();
      
    }
    await user.save();
  }
}

async function markCompletedChallenges() {
  try {
    const now = new Date();

    const completedChallenges = await challengemongo.find({
      EndDate: { $lte: now },
      Status: 'Active'
    });

    if (completedChallenges.length === 0) {
      console.log('No challenges to mark as completed.');
      return;
    }

    const result = await challengemongo.updateMany(
      { _id: { $in: completedChallenges.map(c => c._id) } },
      { $set: { Status: 'Completed' } }
    );

    console.log(`${result.modifiedCount} challenges marked as Completed.`);

    const nonProofChallenges = completedChallenges.filter(c => c.Challenge_Type === 'Non-Proof');

    for (const challenge of nonProofChallenges) {
      await generateNonProofWinnersExcelForChallenge(challenge._id);
    }

    const proofChallenges = completedChallenges.filter(c => c.Challenge_Type === 'Proof');

    for (const challenge of proofChallenges) {
      await generateProofChallengeLeaderboard(challenge._id);
    }

  } catch (error) {
    console.error('Error updating challenges:', error);
  }
}

async function generateNonProofWinnersExcelForChallenge(challengeId) {
  try {
    const challenge = await challengemongo.findById(challengeId);
    if (!challenge) return;

    const users = await usermongo.find({
      'ActiveChallenge.challengeId': challenge._id
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("NonProof Winners");

    worksheet.columns = [
      { header: "Challenge Title", key: "title", width: 30 },
      { header: "Reward", key: "reward", width: 25 },
      { header: "Rank", key: "rank", width: 10 },
      { header: "User Name", key: "user", width: 25 },
      { header: "Scan Date (IST)", key: "scanDate", width: 25 },
    ];

    const sorted = users
      .filter(u => u.Streak?.CurrentTrack)
      .sort((a, b) => new Date(a.Streak.CurrentTrack) - new Date(b.Streak.CurrentTrack));

    const topParticipants = sorted.slice(0, 5);
    if (topParticipants.length === 0) return;

    for (let i = 0; i < topParticipants.length; i++) {
      const user = topParticipants[i];
      const rank = i + 1;

      let reward;
      if (rank === 1 && challenge.Rewards?.Winner) reward = challenge.Rewards.Winner;
      else if (rank <= 3 && challenge.Rewards?.Top3) reward = challenge.Rewards.Top3;
      else if (rank <= 5 && challenge.Rewards?.Top5) reward = challenge.Rewards.Top5;
      else reward = challenge.Rewards?.Participants || "N/A";

      const istDate = new Date(user.Streak.CurrentTrack);
      const formattedIST = new Date(istDate.getTime() + (5.5 * 60 * 60 * 1000))
        .toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      worksheet.addRow({
        title: challenge.Title,
        reward,
        rank: `Top ${rank}`,
        user: user.Name || user.username || user.email || "Unknown",
        scanDate: formattedIST,
      });
    }

    const saveDir = "C:\\Users\\manoj\\OneDrive\\Desktop\\FitStreak-Winners";
    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

    const filePath = path.join(saveDir, `NonProof_Leaderboard_${challenge.Title}_${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    console.log(`✅ Excel file generated for challenge "${challenge.Title}": ${filePath}`);
    return filePath;

  } catch (error) {
    console.error("❌ Error generating NonProof leaderboard:", error);
  }
}

async function ProofChallenge() {
  const users = await usermongo.find();

  for (const user of users) {
    const challenges = user.ActiveChallenge;

    for (const challengeEntry of challenges) {
      const { challengeId, startDate, endDate, ChallengeScan } = challengeEntry;

      if (!challengeId || !startDate || !endDate) continue;

      const now = new Date();
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      if (now < endOfDay) continue;

      const challenge = await challengemongo.findById(challengeId);
      if (!challenge || challenge.Challenge_Type !== "Proof") continue;

      const duration = challenge.Duration || 1;
      const scanCount = ChallengeScan || 0;

      const alreadyCompleted = user.ChallengesCompleted.some(
        c => c.challengeId.toString() === challenge._id.toString()
      );
      if (alreadyCompleted) continue;

      if (scanCount >= duration) {
        // User wins
        user.ChallengesCompleted.push({
          challengeId: challenge._id,
          completeDate: now,
          Status: "Won"
        });

        if (!user.challengeWins.some(c => c.challengeId.toString() === challenge._id.toString())) {
          user.challengeWins.push({ challengeId: challenge._id, WinDate: now });
        }

        if (!challenge.ChallengeWinners.some(c => c.UserId.toString() === user._id.toString())) {
          challenge.ChallengeWinners.push({ UserId: user._id, WonDate: now });
        }

        await sendNotification(
            user.NotificationToken,
            `🎉 Congratulations, Legend ${user.username}! 🐦‍🔥`,
            `You won the "${challenge.Title}" challenge! 15 points have been added to your account, and your reward will be processed within 2 days. Keep up the great work!`
        );


        user.Points += 15;
      } else {
        // User loses
        user.ChallengesCompleted.push({
          challengeId: challenge._id,
          completeDate: now,
          Status: "Lose"
        });

        await sendNotification(
            user.NotificationToken,
            "Challenge Completed!",
            `You didn't win the "${challenge.Title}" challenge this time. Don't worry—keep going, and you'll crush it next time! 💪`
        );

        if (!user.challengeLosed.some(c => c.challengeId.toString() === challenge._id.toString())) {
          user.challengeLosed.push({ challengeId: challenge._id, LoseDate: now });
        }

        if (!challenge.ChallengeLosers.some(c => c.UserId.toString() === user._id.toString())) {
          challenge.ChallengeLosers.push({ UserId: user._id, LoseDate: now });
        }
      }

      await challenge.save();
    }

    await user.save();
  }
}

async function generateProofChallengeLeaderboard(challengeId) {
  try {
    const proofs = await Proofmongo.find({ 
      challengeId, 
      Status: "Approve" 
    }).sort({ submissionDate: 1 });

    const leaderboard = [];
    for (const proof of proofs) {
      const user = await usermongo.findById(proof.userId);
      if (!user) continue;
      leaderboard.push({
        username: user.username || user._id.toString(),
        userId: user._id,
        submissionDate: proof.submissionDate,
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Proof Challenge Leaderboard');

    sheet.columns = [
      { header: 'Rank', key: 'rank', width: 10 },
      { header: 'User ID', key: 'userId', width: 30 },
      { header: 'Username', key: 'username', width: 25 },
      { header: 'Submission Date', key: 'submissionDate', width: 25 },
      { header: 'Category', key: 'category', width: 15 },
    ];

    leaderboard.forEach((entry, index) => {
      let category = '';
      if (index === 0) category = 'Winner';
      else if (index < 3) category = 'Top 3';
      else if (index < 5) category = 'Top 5';
      else if (index < 10) category = 'Top 10';

      sheet.addRow({
        rank: index + 1,
        userId: entry.userId.toString(),
        username: entry.username,
        submissionDate: new Date(entry.submissionDate).toLocaleString(),
        category,
      });
    });

    const fileName = `Proof_Challenge_Leaderboard_${challengeId}.xlsx`;
    await workbook.xlsx.writeFile(fileName);
    
  } catch (err) {
    console.error('Error generating leaderboard:', err);
  }
}

cron.schedule('00 01 * * *', async () => {
  await NonProof();
  await ProofChallenge();
  await markCompletedChallenges();
}, {
  timezone: 'Asia/Kolkata'
});


module.exports = router;