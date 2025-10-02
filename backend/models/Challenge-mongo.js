const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
    Title: String,
    Description: String,
    EndDate: Date,
    Duration: Number,
    Challenge_Type: { type: String, enum: ['Proof', 'Non-Proof'], required: true },
    Participants: [{
        UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        Status: { type: String, enum: ['Joined', 'Completed', 'Failed'], default: 'Joined' }
    }],
    Rewards: {
        Winner: String,
        Top3: String,
        Top5: String,
        Top10: String,
        Participants: String
    },
    ProofType: { type: String, enum: ['Video', 'Image'] },
    CreatedAt: { type: Date, default: Date.now },
    Status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
    By: { type: String, enum: ['FitStreak', 'Gym'], required: true },
    ChallengeWinners: [{
        UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        WonDate: Date,
    }],
    ChallengeLosers: [{
        UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        LoseDate: Date,
    }],
});

module.exports = mongoose.model('Challenges', ChallengeSchema);
