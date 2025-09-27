const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    TotalPost: { type: Number, default: 0 },
    password: String,
    Points: { type: Number, default: 0 },
    Streak: { 
        Scan: { type: Number, default: 0 },
        CurrentScan: { type: Date },
        lastScan: { type: Date },
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
    Steps: {
    currentWeek: {
      Monday: { type: Number, default: 0 },
      Tuesday: { type: Number, default: 0 },
      Wednesday: { type: Number, default: 0 },
      Thursday: { type: Number, default: 0 },
      Friday: { type: Number, default: 0 },
      Saturday: { type: Number, default: 0 },
      Sunday: { type: Number, default: 0 }
    },
    weekStart: { type: Date }, // Start date of the current week (Monday)
    pastWeeks: [{
        weekStart: Date,
        steps: {
          Monday: Number,
          Tuesday: Number,
          Wednesday: Number,
          Thursday: Number,
          Friday: Number,
          Saturday: Number,
          Sunday: Number
        }
      }]
    },
    Reactions: { type: Number, default: 0 },
    totalSteps: Number,
    totalBPM: Number,
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
