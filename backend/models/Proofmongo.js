const mongoose = require('mongoose');

const ProofSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenges', required: true },
  ProofVideo: String,
  Status: {
    type: String,
    enum: ['Pending', 'Approve', 'Reject'],
    default: 'Pending',
  },
  submissionDate: String,
});

module.exports = mongoose.model('Proof', ProofSchema);
