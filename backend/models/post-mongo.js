const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    Content: String,
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    CreatedAt: { type: Date, default: Date.now },
    Biceps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    Fire: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    Boring: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Post', postSchema);
