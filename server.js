const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const Post = require('./models/Post');
const Chat = require('./models/Chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://bkpconnect-git-main-abhi1234sarks-projects.vercel.app/login",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: false, // Bypass SSL validation for development
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Socket.IO Chat functionality
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join chat room
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  // Send message
  socket.on('sendMessage', async ({ roomId, message }) => {
    try {
      let chat = await Chat.findOne({ roomId });
      if (!chat) {
        chat = await Chat.create({ 
          roomId, 
          messages: [],
          participants: [message.admin]
        });
      }
      
      chat.messages.push(message);
      chat.lastMessage = new Date();
      await chat.save();

      // Populate user info for real-time emit
      const populatedMsg = await chat.populate('messages.admin', 'username profilePic');
      const lastMsg = populatedMsg.messages[populatedMsg.messages.length - 1];

      io.to(roomId).emit('messageReceived', { roomId, message: lastMsg });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Join post room for comments
  socket.on('joinPostRoom', (postId) => {
    socket.join(postId);
    console.log(`User joined post room: ${postId}`);
  });

  // New comment
  socket.on('newComment', async ({ postId, userId, text }) => {
    try {
      const comment = {
        commenter: userId,
        text,
        createdAt: new Date()
      };
      
      await Post.findByIdAndUpdate(postId, { $push: { comments: comment } });

      // Fetch the last comment with user info populated
      const post = await Post.findById(postId)
        .populate('comments.commenter', 'username profilePic');
      const lastComment = post.comments[post.comments.length - 1];

      io.to(postId).emit('commentAdded', {
        postId,
        comment: lastComment
      });
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
