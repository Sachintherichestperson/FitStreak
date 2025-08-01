const mongoose = require('mongoose');

const Shame_Panel = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    ProfilePic: String,
    Days_Missed: { type: Number, default: 0 },
    StreakLost: { type: Number, default: 0 },
    Motivate: { type: Number, default: 0 },
    Roast: { type: Number, default: 0 },
    Date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Shame_Panel', Shame_Panel);
