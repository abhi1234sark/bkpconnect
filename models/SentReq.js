const mongoose = require('mongoose');

const SentReqSchema = new mongoose.Schema({
  profile: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('SentReq', SentReqSchema); 