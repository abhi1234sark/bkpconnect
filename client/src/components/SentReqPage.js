import React, { useEffect, useState } from 'react';
import api from '../api';

const SentReqPage = () => {
  const [sentReqs, setSentReqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingUsers, setSendingUsers] = useState(new Set());

  useEffect(() => {
    fetchSentReqs();
  }, []);

  const fetchSentReqs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sentreq');
      console.log('Fetched sent requests:', response.data.sentreq);
      setSentReqs(response.data.sentreq);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (userId) => {
    try {
      setSendingUsers(prev => new Set(prev).add(userId));
      
      // Send the friend request
      await api.post('/incomingreq', { userId });
      
      // Add user to delsentreq to filter them out
      await api.post('/delsentreq', { userId });
      
      // Immediately remove the user from the frontend list
      setSentReqs(prev => {
        const filtered = prev.filter(req => req.profile._id !== userId);
        console.log('Removed user from sent requests list:', userId);
        console.log('Updated sent requests list:', filtered);
        return filtered;
      });
      
      alert('Friend request sent!');
      
      // Refresh the list to ensure it's up to date
      fetchSentReqs();
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send request. Please try again.');
    } finally {
      setSendingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2>People You May Know</h2>
        <p>Loading...</p>
      </div>
    );
  }

  console.log('Sent requests:', sentReqs.length);

  return (
    <div>
      <h2>People You May Know</h2>
      {sentReqs.length === 0 ? (
        <div className="card">
          <p>No suggestions available at the moment.</p>
        </div>
      ) : (
        sentReqs.map(req => (
          <div key={req.profile._id} className="friend-item">
            <img 
              src={req.profile.profilePic} 
              alt="" 
              className="friend-avatar"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/50';
              }}
            />
            <div className="friend-info">
              <strong>{req.profile.username}</strong>
            </div>
            <div className="friend-actions">
              <button 
                className="btn" 
                onClick={() => sendRequest(req.profile._id)}
                disabled={sendingUsers.has(req.profile._id)}
              >
                {sendingUsers.has(req.profile._id) ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SentReqPage; 