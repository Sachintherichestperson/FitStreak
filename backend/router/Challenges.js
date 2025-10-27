const express = require('express');
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const Usermongo = require('../models/User-mongo');
const Postmongo = require('../models/post-mongo');
const Challengemongo = require('../models/Challenge-mongo');
const isloggedin = require('../middleware/isloggein');
const Proofmongo = require('../models/Proofmongo');
const { sendNotification } = require('../functions/Notification')
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const allowedTypes = ["image", "video"];
        const fileType = file.mimetype.split("/")[0];
        if (!allowedTypes.includes(fileType)) {
            throw new Error("Only image and video files are allowed!");
        }

        return {
            folder: "uploads",
            format: file.mimetype.split("/")[1],
            public_id: file.originalname.split(".")[0],
            resource_type: fileType,
        };
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileType = file.mimetype.split("/")[0];
        if (fileType === "image" || fileType === "video") {
            cb(null, true);
        } else {
            cb(new Error("Only images and videos are allowed"), false);
        }
    },
});


router.get('/', isloggedin, async (req, res) => {
    try {
        const challenges = await Challengemongo.find();
        
        const user = await Usermongo.findById(req.user._id)
            .populate('ActiveChallenge.challengeId')
            .populate('ChallengesCompleted.challengeId');
        
        const challengesWithUserData = challenges.map(challenge => {
            const activeChallenge = user.ActiveChallenge.find(ac => 
                ac.challengeId && ac.challengeId._id.equals(challenge._id));
            
            const completedChallenge = user.ChallengesCompleted.find(cc => 
                cc.challengeId && cc.challengeId._id.equals(challenge._id));

            let progress = 0;
            let startDate = null;
            let endDate = null;

            if (activeChallenge) {
                startDate = activeChallenge.startDate;
                endDate = activeChallenge.endDate;

                if (startDate && endDate) {
                    const now = new Date();
                    const totalDuration = new Date(endDate) - new Date(startDate);
                    const elapsed = now - new Date(startDate);
                    progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100); // Clamp 0-100%
                }
            }

            return {
                _id: challenge._id,
                Title: challenge.Title,
                By: challenge.By || 'general',
                Duration: challenge.Duration,
                Description: challenge.Description,
                Status: challenge.Status || false,
                isParticipating: !!activeChallenge,
                progress: progress,
                isCompleted: !!completedChallenge,
                completionStatus: completedChallenge ? completedChallenge.Status : null,
                startDate: startDate,
                endDate: endDate
            };
        });

        res.json({ challenges: challengesWithUserData });
    } catch (error) {
        console.error('Error fetching challenges:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', isloggedin, async (req, res) => {
  const userId = req.user.id;
  const challengeId = req.params.id;

  try {
    const challenge = await Challengemongo.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const user = await Usermongo.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const progressEntry = user.ActiveChallenge.find(active =>
      active.challengeId.toString() === challengeId.toString()
    );

    let startDate = null;
    let endDate = null;
    let progress = 0;
    let isJoined = false;

    if (progressEntry) {
      isJoined = true;
      startDate = progressEntry.startDate;
      endDate = progressEntry.endDate;

      const now = new Date();
      const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      const daysPassed = Math.ceil((now - new Date(startDate)) / (1000 * 60 * 60 * 24));
      progress = Math.min(daysPassed / totalDays, 1);
    }

    res.json({
      challenge,
      userId,
      isJoined,
      startDate,
      endDate,
      progress
    });

  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/join', isloggedin, async (req, res) => {
    const userId = req.user.id;
    const challengeId = req.params.id;
    try {
        const challenge = await Challengemongo.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        function calculateEndDateSkippingSundays(startDate, durationDays) {
            let date = new Date(startDate);
            let daysAdded = 0;

            while (daysAdded < durationDays) {
                date.setDate(date.getDate() + 1);
                if (date.getDay() !== 0) {
                    daysAdded++;
                }
            }

            return date;
        }

        if (challenge.ChallengeLosers.includes(userId)){
          return res.status(404).json({ error: "User already Lost the Challenge" });
        }else if (challenge.ChallengeWinners.includes(userId)){
          return res.status(404).json({ error: "User already Won the Challenge" });
        }

        const startDate = new Date();
        const duration = challenge.Duration || 7;
        const endDate = calculateEndDateSkippingSundays(startDate, duration);

        const user = await Usermongo.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isParticipant = challenge.Participants.some(participant => participant.UserId.toString() === userId);
        if (isParticipant) {
            return res.status(400).json({ error: 'You are already a participant in this challenge' });
        }

        user.ActiveChallenge.push({
            challengeId: challenge._id,
            startDate: new Date(),
            endDate,
        });

        user.Points += 3;
        challenge.Participants.push({ UserId: userId });
        await challenge.save();
        await user.save();

        await sendNotification(
          user.NotificationToken,
          "Congrats Bro!!",
          `You SuccessFully Joined the Challenge "${challenge.Title}"`
        )

        res.json({ message: 'Challenge joined successfully' });
    } catch (error) {
        console.error('Error joining challenge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/leave', isloggedin, async (req, res) => {
    const userId = req.user.id;
    const challengeId = req.params.id;

    try {
        const user = await Usermongo.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const challenge = await Challengemongo.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        const activeChallenge = user.ActiveChallenge.find(active =>
            active.challengeId.toString() === challengeId.toString()
        );

        if (!activeChallenge) {
            return res.status(400).json({ error: 'You are not a participant in this challenge' });
        }

        user.ActiveChallenge = user.ActiveChallenge.filter(active =>
            active.challengeId.toString() !== challengeId.toString()
        );

        challenge.Participants = challenge.Participants.filter(participant =>
            participant.UserId.toString() !== userId.toString()
        );

        await user.save();
        await challenge.save();

        res.json({ message: 'Challenge left successfully' });
    } catch (error) {
        console.log('Error leaving challenge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/Proof/:id", isloggedin, async (req, res) => {
    const challengeId = req.params.id;

    try {
        const challenge = await Challengemongo.findById(challengeId);

        res.status(200).json({ challenge });
    } catch (error) {
        console.error('Error fetching challenge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/submit-proof', upload.single('proofData'), isloggedin, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { challengeId, submissionDate } = req.body;

    // Create proof document (in memory)
    const proof = new Proofmongo({
      challengeId,
      userId: req.user._id,
      ProofVideo: req.file.path,
      submissionDate,
      Status: 'Pending'
    });

    // Save proof first
    await proof.save();

    // Directly update user's ActiveChallenge with the new proof ID
    await Usermongo.updateOne(
      { _id: req.user._id, 'ActiveChallenge.challengeId': challengeId },
      { $set: { 'ActiveChallenge.$.Proof': proof._id } }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Proof submitted successfully',
      filePath: req.file.path
    });
  } catch (error) {
    console.error('Error submitting proof:', error);
    res.status(500).json({ success: false, message: 'Error submitting proof' });
  }
});

router.get('/Proof-Status/:id', isloggedin, async (req, res) => {
  try {
    const challengeId = req.params.id;
    const user = await Usermongo.findById(req.user.id).populate('ActiveChallenge.Proof');

    const activeChallenge = user.ActiveChallenge.find(active =>
      active.challengeId.toString() === challengeId.toString()
    );

    let status;
    let lastSubmissionDate = null;

    if (activeChallenge?.Proof?.submissionDate) {
      const dateObj = new Date(activeChallenge.Proof.submissionDate);
      if (!isNaN(dateObj)) {
        lastSubmissionDate = activeChallenge.Proof.submissionDate;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const submissionDate = lastSubmissionDate ? new Date(lastSubmissionDate).toISOString().split('T')[0] : null;

    if (submissionDate === today) {
      status = activeChallenge.Proof.Status;
    } else {
      status = 'To-be-submitted';
    }

    res.json({ 
      status,
      lastSubmissionDate 
    });
  } catch (error) {
    console.error('Error fetching proofs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/check-challenge-result/:id', isloggedin, async (req, res) => {
   try{
    const challengeId = req.params.id;
    const userId = req.user.id;
    const challenge = await Challengemongo.findById(challengeId);

    let Status;
    console.log(challenge.ChallengeLosers.some(loser => loser.UserId.toString() === userId.toString()))

    if (challenge.ChallengeLosers.some(loser => loser.UserId.toString() === userId.toString())){
      Status = "Lose"
    }else if(challenge.ChallengeWinners.some(Winner => Winner.UserId.toString() === userId.toString())){
      Status = "Won"
    }else{
      Status = "Pending"
    }

    res.json({ Status });
   }catch (error) {
    console.error('Error checking challenge result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
