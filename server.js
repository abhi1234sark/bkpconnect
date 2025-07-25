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
 // Import middleware object (do NOT use app.use(middleware))
// Do NOT use: app.use(middleware) or app.use(require('./middleware'))
// Only use individual middleware functions in routes, e.g.:


const app = express();
const server = http.createServer(app);

// Increase timeout for large file uploads
server.timeout = 600000; // 10 minutes

//const allowedOrigin =  "https://bkpconnect-git-main-abhi1234sarks-projects.vercel.app";

app.use(cors({
  origin: '*',        // Allow all origins (Hoppscotch, Vercel, etc.)
  credentials: true,  // Set to true if you use cookies or tokens in future
}));



const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    credentials: true,
  }
});


//app.use(cors({
  //origin: allowedOrigin,
  //credentials: true
//}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: false,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));


app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

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

      const populatedMsg = await chat.populate('messages.admin', 'username profilePic');
      const lastMsg = populatedMsg.messages[populatedMsg.messages.length - 1];

      io.to(roomId).emit('messageReceived', { roomId, message: lastMsg });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('joinPostRoom', (postId) => {
    socket.join(postId);
    console.log(`User joined post room: ${postId}`);
  });

  socket.on('newComment', async ({ postId, userId, text }) => {
    try {
      const comment = {
        commenter: userId,
        text,
        createdAt: new Date()
      };
      
      await Post.findByIdAndUpdate(postId, { $push: { comments: comment } });

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


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
