const express = require('express');
const router = express.Router();
const { auth, upload } = require('../middleware');
const User = require('../models/User');
const Post = require('../models/Post');
const SentReq = require('../models/SentReq');
const Chat = require('../models/Chat');

// --- POSTS ---

// Upload a post (image/video)
router.post('/posts', auth, upload.single('file'), async (req, res) => {
  try {
    const post = new Post({
      url: req.file.path,
      filetype: req.file.mimetype,
      createdBy: req.user.id,
    });
    await post.save();
    
    // Populate user info before sending response
   /// await post.populate('createdBy', 'username profilePic');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  
});

// Get posts (feed, paginated, filter by type)
router.get('/posts', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const user = await User.findById(req.user.id);
    const userIds = [user._id, ...user.friends];
    
    // Build query based on type
    let query = { createdBy: { $in: userIds } };
    
    // If type is not 'all', filter by filetype
    if (type !== 'all') {
      query.filetype = { $regex: type };
    }
    
    const posts = await Post.find(query)
      .populate('createdBy', 'username profilePic')
      .populate('comments.commenter', 'username profilePic')
      .sort({ created: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
      
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single post with comments (populated)
router.get('/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('createdBy', 'username profilePic')
      .populate('comments.commenter', 'username profilePic');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LIKES ---

// Like a post
router.post('/like', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.liked.includes(req.body.postId)) {
      user.liked.push(req.body.postId);
      await user.save();
    }
    res.json({ status: 'liked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unlike a post
router.delete('/like', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.liked = user.liked.filter(id => id.toString() !== req.body.postId);
    await user.save();
    res.json({ status: 'unliked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get liked posts (paginated)
router.get('/like', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = await User.findById(req.user.id);
    const posts = await Post.find({ _id: { $in: user.liked } })
      .populate('createdBy', 'username profilePic')
      .sort({ created: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if post is liked
router.get('/check', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const liked = user.liked.includes(req.query.postId);
    res.json({ liked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FRIEND REQUESTS ---

// Create sentreq on signup
router.post('/sentreq', auth, async (req, res) => {
  try {
    const sentreq = new SentReq({ profile: req.user.id });
    await sentreq.save();
    res.json(sentreq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sentreqs (paginated, filtered)
router.get('/sentreq', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const dels = user.delsentreq.map(id => id.toString());
    const sentreqs = await SentReq.find({})
      .populate('profile', 'username profilePic')
      .limit(20);
    const filtered = sentreqs.filter(req => !dels.includes(req.profile._id.toString()));
    res.json({ sentreq: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove sentreq after sending
router.post('/delsentreq', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const other = await User.findById(req.body.userId);
    user.delsentreq.push(req.body.userId);
    other.delsentreq.push(req.user.id);
    await user.save();
    await other.save();
    res.json({ status: 'removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send incoming request
router.post('/incomingreq', auth, async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user.incomingreq.includes(req.user.id)) {
      user.incomingreq.push(req.user.id);
      await user.save();
    }
    res.json({ status: 'sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get incoming requests
router.get('/incomingreq', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('incomingreq', 'username profilePic');
    res.json({ incomingreq: user.incomingreq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept friend request
router.post('/friend', auth, async (req, res) => {
  try {
    const my = await User.findById(req.user.id);
    const other = await User.findById(req.body.userId);
    
    if (!my.friends.includes(req.body.userId)) my.friends.push(req.body.userId);
    if (!other.friends.includes(req.user.id)) other.friends.push(req.user.id);
    
    // Remove from incomingreq
    my.incomingreq = my.incomingreq.filter(id => id.toString() !== req.body.userId);
    
    await my.save();
    await other.save();
    res.json({ status: 'friends' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get friends (paginated)
router.get('/friend', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user.id)
      .populate({ 
        path: 'friends', 
        select: 'username profilePic', 
        options: { limit: Number(limit), skip: (page - 1) * limit } 
      });
    res.json({ friends: user.friends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's delsentreq array
router.get('/user/delsentreq', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ delsentreq: user.delsentreq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROFILE ---

// Upload profile pic
router.post('/user', auth, upload.single('file'), async (req, res) => {
  try {
    // Get the logged-in user's ID from JWT token
    const user = await User.findById(req.user.id);
    user.profilePic = req.file.path;
    await user.save();
    res.json({ profilePic: user.profilePic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile
router.get('/userprofile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.query.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ username: user.username, profilePic: user.profilePic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's posts (paginated)
router.get('/userprofile/posted', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const posts = await Post.find({ createdBy: req.query.userId })
      .populate('createdBy', 'username profilePic')
      .populate('comments.commenter', 'username profilePic')
      .sort({ created: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /MYProfile?userId=...
router.get('/MYProfile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.query.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      username: user.username,
      profilePic: user.profilePic
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /MyProfile/posted?userId=...&page=...
router.get('/MyProfile/posted', auth, async (req, res) => {
  try {
    const { userId, page = 1, limit = 10 } = req.query;
    const posts = await Post.find({ createdBy: userId })
      .populate('createdBy', 'username profilePic')
      .populate('comments.commenter', 'username profilePic')
      .sort({ created: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CHAT ---

// Get chat messages
router.get('/chat/:roomId', auth, async (req, res) => {
  try {
    let chat = await Chat.findOne({ roomId: req.params.roomId })
      .populate('messages.admin', 'username profilePic');
    if (!chat) {
      chat = await Chat.create({ 
        roomId: req.params.roomId, 
        messages: [],
        participants: [req.user.id]
      });
    }
    res.json({ messages: chat.messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a chat file (image/video/audio/document)
router.post('/chat/upload', auth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
      }
      if (err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'File upload failed' });
    }
    
    try {
      console.log('Chat upload route hit');
      console.log('File received:', req.file);
      console.log('File size:', req.file?.size);
      console.log('File mimetype:', req.file?.mimetype);
      
      if (!req.file || !req.file.path) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      console.log('File path:', req.file.path);
      console.log('File mimetype:', req.file.mimetype);
      
      res.status(201).json({
        url: req.file.path,
        filetype: req.file.mimetype,
      });
      
      console.log('Chat upload successful');
    } catch (err) {
      console.error('Chat upload error:', err);
      res.status(500).json({ error: err.message });
    }
  });
});

module.exports = router;
