const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  text: { 
    type: String, 
    trim: true 
  },
  fileUrl: { 
    type: String 
  },
  fileType: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const ChatSchema = new mongoose.Schema({
  roomId: { 
    type: String, 
    required: true,
    unique: true
  },
  messages: [MessageSchema],
  lastMessage: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Chat', ChatSchema); 