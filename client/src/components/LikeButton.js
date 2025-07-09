import React, { useEffect, useState } from 'react';
import api from '../api';

const LikeButton = ({ postId }) => {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const response = await api.get('/check', { params: { postId } });
        setLiked(response.data.liked);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();
  }, [postId]);

  const handleClick = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      if (liked) {
        await api.delete('/like', { data: { postId } });
        setLiked(false);
      } else {
        await api.post('/like', { postId });
        setLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={loading}
      style={{ 
        color: liked ? 'white' : 'black', 
        backgroundColor: liked ? '#1877f2' : '#e4e6eb',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: loading ? 'not-allowed' : 'pointer',
        marginRight: '10px',
        fontWeight: '500'
      }}
    >
      {loading ? '...' : (liked ? '❤️ Liked' : '🤍 Like')}
    </button>
  );
};

export default LikeButton; 