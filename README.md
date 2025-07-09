# Advanced Chat Application

A full-stack social media chat application built with React, Node.js, Express, MongoDB, and Socket.IO. Features include real-time messaging, friend requests, post sharing, likes, comments, and profile management.

## Features

### 🔐 Authentication
- User registration and login with JWT tokens
- Secure password hashing with bcrypt
- Protected routes and API endpoints

### 📱 Social Features
- **Feed**: View posts from friends with infinite scroll
- **Posts**: Upload images and videos with Cloudinary integration
- **Likes**: Like and unlike posts
- **Comments**: Real-time commenting system
- **Friend System**: Send and accept friend requests
- **Profiles**: View your own and other users' profiles

### 💬 Real-time Chat
- **Private Messaging**: One-on-one chat with friends
- **File Sharing**: Send images, videos, and documents
- **Real-time Updates**: Instant message delivery with Socket.IO
- **Chat History**: Persistent message storage

### 🎨 User Interface
- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Clean, Facebook-inspired interface
- **Infinite Scroll**: Smooth pagination for posts and friends
- **Real-time Updates**: Live notifications and updates

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Cloud storage for media files

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **CSS3** - Styling

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatappadvance
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/chatappadvance
   JWT_SECRET=your_jwt_secret_key_here
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   PORT=5000
   ```

5. **Set up Cloudinary** (for file uploads)
   - Sign up at [Cloudinary](https://cloudinary.com/)
   - Get your cloud name, API key, and API secret
   - Create an upload preset
   - Update the environment variables

6. **Start MongoDB**
   ```bash
   # On Windows
   mongod
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd client
   npm start
   ```

3. **Or run both simultaneously**
   ```bash
   npm run dev:full
   ```

### Production Mode

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Posts
- `POST /api/posts` - Upload a post
- `GET /api/posts` - Get feed posts
- `GET /api/posts/:id` - Get single post

### Likes
- `POST /api/like` - Like a post
- `DELETE /api/like` - Unlike a post
- `GET /api/check` - Check if post is liked

### Friend Requests
- `POST /api/sentreq` - Create sent request
- `GET /api/sentreq` - Get sent requests
- `POST /api/incomingreq` - Send friend request
- `GET /api/incomingreq` - Get incoming requests
- `POST /api/friend` - Accept friend request
- `GET /api/friend` - Get friends list

### Profile
- `POST /api/user` - Upload profile picture
- `GET /api/userprofile` - Get user profile
- `GET /api/MYProfile` - Get current user profile

### Chat
- `GET /api/chat/:roomId` - Get chat messages

## Socket.IO Events

### Chat Events
- `joinRoom` - Join a chat room
- `sendMessage` - Send a message
- `messageReceived` - Receive a message

### Comment Events
- `joinPostRoom` - Join a post room for comments
- `newComment` - Add a new comment
- `commentAdded` - Receive a new comment

## Project Structure

```
chatappadvance/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.js         # Main app component
│   │   ├── api.js         # API configuration
│   │   └── index.js       # Entry point
│   └── package.json
├── models/                 # MongoDB models
│   ├── User.js
│   ├── Post.js
│   ├── SentReq.js
│   └── Chat.js
├── routes/                 # API routes
│   ├── auth.js
│   └── api.js
├── middleware/             # Custom middleware
│   ├── auth.js
│   ├── upload.js
│   └── index.js
├── server.js              # Main server file
├── package.json
└── README.md
```

## Key Features Implementation

### Infinite Scroll
The application implements infinite scroll for posts and friends lists using:
- Scroll event listeners
- Pagination with skip/limit
- State management for loading and hasMore flags

### Real-time Features
Socket.IO is used for:
- Instant message delivery
- Real-time comments
- Live notifications

### File Upload
Cloudinary integration provides:
- Image and video uploads
- Automatic file optimization
- Secure cloud storage
- Multiple file format support

### Authentication
JWT-based authentication with:
- Token-based session management
- Protected API routes
- Automatic token refresh
- Secure password storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. 