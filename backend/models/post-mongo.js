const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    Content: String,
    Image: String,
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    CreatedAt: { type: Date, default: Date.now },
    Biceps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    Fire: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    Boring: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    Comment: [{
        UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        Comment: String
    }]
});

module.exports = mongoose.model('Post', postSchema);
