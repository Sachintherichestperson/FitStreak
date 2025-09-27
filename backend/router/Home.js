const express = require('express');
const router = express.Router();
const Usermongo = require('../models/User-mongo');
const Postmongo = require('../models/post-mongo');
const Challengemongo = require('../models/Challenge-mongo');
const isloggedin = require('../middleware/isloggein');
const Gymmongo = require('../models/Gymmongo');
const Streakfunction = require('../functions/Streak');

router.get('/', isloggedin, async (req, res) => {
    const user = await Usermongo.findOne({ _id: req.user._id })
        .populate('CurrentBadge')
        .populate('ActiveChallenge.challengeId')
        .populate('ChallengesCompleted.challengeId');
    
    const loggedDates = user.WorkoutLog
        .filter(log => log.scanned)
        .map(log => log.date.toISOString().split('T')[0]);

    const FitCoins = user.FitCoins || 0
    const Status = user.CurrentBadge;
    
    res.json({ 
        user,
        streak: user.Streak.Scan,
        loggedDates,
        FitCoins,
        Status
    });
});

router.post('/Scan', isloggedin, async (req, res) => {
  const { qrData } = req.body;

  if (!qrData) {
    return res.status(400).json({ error: 'No QR data received' });
  }

  try {
    let gymId;
    try {
      const url = new URL(qrData);
      gymId = url.searchParams.get("gymId");
    } catch (urlErr) {
      console.log("Invalid QR format", urlErr);
      return res.status(400).json({ error: 'Invalid QR format' });
    }

    const user = await Usermongo.findById(req.user._id)
      .populate('ActiveChallenge.challengeId');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (gymId !== user.Unicode) {
      return res.status(400).json({ error: 'QR code does not match your assigned gym ❌' });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const currentScan = user.Streak.CurrentScan;
    if (currentScan) {
      const last = new Date(currentScan);
      const isSameDay =
        last.getDate() === today.getDate() &&
        last.getMonth() === today.getMonth() &&
        last.getFullYear() === today.getFullYear();

      if (isSameDay) {
        return res.status(400).json({ message: 'You already checked in today ❌' });
      }
    }

    user.Streak.Scan = (user.Streak.Scan || 0) + 1;
    user.Streak.lastScan = user.Streak.CurrentScan || null;
    user.Streak.CurrentScan = now;

    if (user.ActiveChallenge && user.ActiveChallenge.length > 0) {
      for (let entry of user.ActiveChallenge) {
        const challenge = entry.challengeId;

        if (challenge && challenge.Challenge_Type === 'Non-Proof') {
          entry.ChallengeScan = (entry.ChallengeScan || 0) + 1;
          const duration = challenge.Duration || 1;
          const progress = Math.floor((entry.ChallengeScan / duration) * 100);
          entry.Progress = Math.min(progress, 100);
        }
      }
    }

    const alreadyLogged = user.WorkoutLog.some(log => {
      const logDate = new Date(log.date);
      return (
        logDate.getDate() === today.getDate() &&
        logDate.getMonth() === today.getMonth() &&
        logDate.getFullYear() === today.getFullYear()
      );
    });

    if (!alreadyLogged) {
      user.WorkoutLog.push({ date: now, scanned: true });
    }

    user.FitCoins += 5;
    user.Points += 10;
    await user.save();

    return res.status(200).json({ message: 'Streak maintained, progress updated, and workout logged 🎉' });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: 'Failed to process QR data' });
  }
});

router.get('/Active-Challenges', isloggedin, async (req, res) => {
    try {
        const user = await Usermongo.findById(req.user._id).populate('ActiveChallenge.challengeId');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const today = new Date();

        const countNonSundays = (startDate, endDate) => {
            let count = 0;
            const date = new Date(startDate);
            while (date <= endDate) {
                if (date.getDay() !== 0) count++; // 0 = Sunday
                date.setDate(date.getDate() + 1);
            }
            return count;
        };

        const challenges = user.ActiveChallenge.map(challenge => {
            const startDate = new Date(challenge.startDate);
            const endDate = new Date(challenge.endDate);
            const currentDate = today > endDate ? endDate : today;

            const totalDays = countNonSundays(startDate, endDate);
            const daysPassed = countNonSundays(startDate, currentDate);
            const progress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

            return {
                id: challenge.challengeId.id,
                name: challenge.challengeId.Title,
                description: challenge.challengeId.Description,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                task: 7,
                daysPassed,
                totalDays,
                progress: progress.toFixed(2)
            };
        });

        res.json({ challenges });
    } catch (err) {
        console.error("Error fetching challenges:", err);
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
});

router.post("/save-push-token", isloggedin, async (req, res) => {
  const { expoPushToken } = req.body;
  console.log(expoPushToken);
});

router.get("/Gym-Location", isloggedin, async (req, res) => {
  const user = await Usermongo.findById(req.user.id);
  const Location = user.Location;

  res.json(Location);
});

module.exports = router;