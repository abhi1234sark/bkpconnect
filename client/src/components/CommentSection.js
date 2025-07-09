import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import api from '../api';

const socket = io('https://bkpconnect.onrender.com');

const CommentSection = ({ postId }) => {
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.emit('joinPostRoom', postId);

    // Fetch existing comments
    const fetchComments = async () => {
      try {
        const response = await api.get(`/posts/${postId}`);
        setComments(response.data.comments || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();

    // Listen for new comments
    socket.on('commentAdded', ({ postId: pid, comment }) => {
      if (pid === postId) {
        setComments(prev => [...prev, comment]);
      }
    });

    return () => {
      socket.off('commentAdded');
    };
  }, [postId]);

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;

    try {
      setLoading(true);
      
      socket.emit('newComment', {
        postId,
        userId: currentUser.id,
        text: text.trim(),
      });
      
      setText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ marginTop: '15px' }}>
      <h4>Comments ({comments.length})</h4>
      
      <div style={{ marginBottom: '15px' }}>
        {comments.map((comment, index) => (
          <div key={index} className="comment">
            <img
              src={comment.commenter?.profilePic || 'https://via.placeholder.com/30'}
              alt=""
              className="comment-avatar"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/30';
              }}
            />
            <div>
              <strong>{comment.commenter?.username || 'Unknown'}</strong>
              <div>{comment.text}</div>
              <small style={{ color: '#666' }}>
                {new Date(comment.createdAt).toLocaleDateString()}
              </small>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          className="input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Write a comment..."
          style={{ flex: 1, marginBottom: 0 }}
        />
        <button 
          className="btn" 
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
};

export default CommentSection; 
