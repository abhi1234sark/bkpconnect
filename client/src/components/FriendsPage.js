import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  const fetchFriends = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await api.get('/friend', { 
        params: { page: pageNum, limit: 10 } 
      });
      
      const newFriends = response.data.friends;
      
      if (append) {
        setFriends(prev => [...prev, ...newFriends]);
      } else {
        setFriends(newFriends);
      }
      
      setHasMore(newFriends.length === 10);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchFriends(1, false);
  }, [fetchFriends]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFriends(nextPage, true);
    }
  };

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop 
          >= document.documentElement.offsetHeight - 1000) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, loading, hasMore]);

  const showProfile = (userId) => {
    navigate(`/userprofile/${userId}`);
  };

  const startChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  if (friends.length === 0 && !loading) {
    return (
      <div className="card">
        <h2>Friends</h2>
        <p>No friends yet. Start by sending friend requests!</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Friends</h2>
      {friends.map(friend => (
        <div key={friend._id} className="friend-item">
          <img 
            src={friend.profilePic} 
            alt="" 
            className="friend-avatar"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/50';
            }}
          />
          <div className="friend-info">
            <strong>{friend.username}</strong>
          </div>
          <div className="friend-actions">
            <button 
              className="btn" 
              onClick={() => showProfile(friend._id)}
            >
              View Profile
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => startChat(friend._id)}
            >
              Chat
            </button>
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="card" style={{ textAlign: 'center' }}>
          Loading more friends...
        </div>
      )}
      
      {!hasMore && friends.length > 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          No more friends to load
        </div>
      )}
    </div>
  );
};

export default FriendsPage; 