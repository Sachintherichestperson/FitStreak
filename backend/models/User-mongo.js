const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    NotificationToken: String,
    Location: {
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
    TotalPost: { type: Number, default: 0 },
    password: String,
    Points: { type: Number, default: 0 },
    Streak: {
        Track: { type: Number, default: 0 },
        CurrentTrack: { type: Date },
        lastScan: { type: Date },
        lastNotificationSent: { type: String }
    },
    cart: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart'
    }],
    CurrentBadge: { type: mongoose.Schema.Types.ObjectId, ref: 'Badges' },
    Badges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badges'
    }],
    DaysMissed: { type: Number, default: 0 },
    StreakLost: { type: Number, default: 0 },
    Buddy: {
        BuddyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        Date: { type: Date }
    },
    BuddyCode: {
      type: String,
      unique: true
    },
    Anonymous_Post: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    IsShame: { type: Boolean, default: false },
    mayChurn: { type: Boolean, default: false },
    ActiveChallenge: [{
        challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenges' },
        startDate: { type: Date, },
        endDate: { type: Date },
        Progress: { type: Number, default: 0 },
        Proof: { type: mongoose.Schema.Types.ObjectId, ref: 'Proof'},
        ChallengeScan: { type: Number, default: 0 } 
    }],
    ChallengesCompleted: [{
      challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenges' },
      completeDate: { type: Date },
      Status: { type: String, enum: ['Won', 'Lose'] }
    }],
    challengeWins: [{
      challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenges' },
      WinDate: { type: Date }
    }],
    challengeLosed: [{
      challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenges' },
      LoseDate: { type: Date }
    }],
    LoginStreak: { type: Number, default: 0 },
    Unicode: String,
    Gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym'
    },
    Reactions: { type: Number, default: 0 },
    WorkoutLog: [{
      date: { type: Date, default: Date.now ,required: true },
      scanned: { type: Boolean, default: false }
    }],
    FitCoins: { type: Number, default: 0 },
    workouts: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "Workout"
    }],
    Diet: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Diet'
    }],
    CaloriesTarget: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', userSchema);
