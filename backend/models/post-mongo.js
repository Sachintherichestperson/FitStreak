const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    Content: String,
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    CreatedAt: { type: Date, default: Date.now },
    Biceps: Number,
    Fire: Number,
    Boring: Number,
});

module.exports = mongoose.model('Post', postSchema);
