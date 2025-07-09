const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  commenter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  text: { 
    type: String, 
    required: true,
    trim: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const PostSchema = new mongoose.Schema({
  url: { 
    type: String, 
    required: true 
  },
  filetype: { 
    type: String, 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  comments: [CommentSchema],
  created: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Post', PostSchema); 