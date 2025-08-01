const mongoose = require('mongoose');

const GymSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Location: { type: String, required: true },
    Description: { type: String },
    MembershipFee: { type: Number, required: true },
    UniCode: { type: String, unique: true, required: true },
    QRData: { type: String },
    QRImage: { type: String },
    Members: [{
        UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        JoinDate: { type: Date, default: Date.now },
        MembershipStatus: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
    }],
    Challenges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenges'
    }],
    MayChurn: { type: Number, default: 0 },
    Complaints: [{
        ComplaintText: { type: String },
        ComplaintDate: { type: Date, default: Date.now }
    }],
    Ratings: [{
        Rating: { type: Number, min: 1, max: 5 },
        ReviewText: { type: String },
        ReviewDate: { type: Date, default: Date.now }
    }],
    CreatedAt: { type: Date, default: Date.now },
    RushHr: { type: Date },
    FitCoinUsed: { type: Number, default: 0 },
});

module.exports = mongoose.model('Gym', GymSchema);