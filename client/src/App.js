import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import Feed from './components/Feed';
import SentReqPage from './components/SentReqPage';
import IncomingReqPage from './components/IncomingReqPage';
import FriendsPage from './components/FriendsPage';
import ProfilePicUpload from './components/ProfilePicUpload';
import UserProfile from './components/UserProfile';
import MyProfile from './components/MyProfile';
import ChatRoom from './components/ChatRoom';
import PostUploader from './components/PostUploader';
import LikedPosts from './components/LikedPosts';

const Sidebar = ({ onLogout }) => (
  <aside className="sidebar">
    <div className="sidebar-logo">💬</div>
    <nav className="sidebar-nav">
      <Link to="/" className="sidebar-link"><span role="img" aria-label="Feed">🏠</span> Feed</Link>
      <Link to="/upload" className="sidebar-link"><span role="img" aria-label="Upload">⬆️</span> Upload</Link>
      <Link to="/likedposts" className="sidebar-link"><span role="img" aria-label="Liked">❤️</span> Liked</Link>
      <Link to="/sentreq" className="sidebar-link"><span role="img" aria-label="Sent">📤</span> Sent</Link>
      <Link to="/incomingreq" className="sidebar-link"><span role="img" aria-label="Incoming">📥</span> Incoming</Link>
      <Link to="/friends" className="sidebar-link"><span role="img" aria-label="Friends">👥</span> Friends</Link>
      <Link to="/profilepic" className="sidebar-link"><span role="img" aria-label="Profile Pic">🖼️</span> Profile Pic</Link>
      <Link to="/myprofile" className="sidebar-link"><span role="img" aria-label="My Profile">👤</span> My Profile</Link>
    </nav>
    <button onClick={onLogout} className="sidebar-logout" title="Logout">🚪 Logout</button>
  </aside>
);

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <div className="container">
          <Routes>
            <Route path="/signup" element={<Signup onSignup={() => window.location.href = '/login'} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-vertical-layout">
        <Sidebar onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Feed type="all" />} />
            <Route path="/upload" element={<PostUploader />} />
            <Route path="/likedposts" element={<LikedPosts />} />
            <Route path="/sentreq" element={<SentReqPage />} />
            <Route path="/incomingreq" element={<IncomingReqPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/profilepic" element={<ProfilePicUpload />} />
            <Route path="/userprofile/:userId" element={<UserProfile />} />
            <Route path="/myprofile" element={<MyProfile />} />
            <Route path="/chat/:userId" element={<ChatRoom />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 