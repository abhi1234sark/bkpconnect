import React, { useEffect, useState } from 'react';
import api from '../api';

const IncomingReqPage = () => {
  const [incomingReqs, setIncomingReqs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIncomingReqs();
  }, []);

  const fetchIncomingReqs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/incomingreq');
      setIncomingReqs(response.data.incomingreq);
    } catch (error) {
      console.error('Error fetching incoming requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (userId) => {
    try {
      await api.post('/friend', { userId });
      
      // Immediately remove the user from the frontend list
      setIncomingReqs(prev => {
        const filtered = prev.filter(req => req._id !== userId);
        console.log('Removed user from incoming requests list:', userId);
        console.log('Updated incoming requests list:', filtered);
        return filtered;
      });
      
      alert('Friend request accepted!');
      
      // Refresh the list to ensure it's up to date
      fetchIncomingReqs();
    } catch (error) {
      alert('Failed to accept request');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2>Incoming Friend Requests</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Incoming Friend Requests</h2>
      {incomingReqs.length === 0 ? (
        <div className="card">
          <p>No incoming friend requests.</p>
        </div>
      ) : (
        incomingReqs.map(req => (
          <div key={req._id} className="friend-item">
            <img 
              src={req.profilePic} 
              alt="" 
              className="friend-avatar"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/50';
              }}
            />
            <div className="friend-info">
              <strong>{req.username}</strong>
            </div>
            <div className="friend-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => acceptRequest(req._id)}
              >
                Accept
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default IncomingReqPage; 