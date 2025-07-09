import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import CommentSection from './CommentSection';
import Modal from './Modal';

const LikedPosts = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [message, setMessage] = useState('');
  const [openCommentPostId, setOpenCommentPostId] = useState(null);

  const fetchLikedPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await api.get('/like', { 
        params: { page: pageNum, limit: 10 } 
      });
      
      const newPosts = response.data.posts;
      
      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(newPosts.length === 10);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchLikedPosts(1, false);
  }, [fetchLikedPosts]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLikedPosts(nextPage, true);
    }
  };

  // Handle when a post is unliked - remove it from the list
  const handlePostUnliked = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    setMessage('Post removed from liked posts');
    setTimeout(() => setMessage(''), 3000);
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

  if (posts.length === 0 && !loading) {
    return (
      <div className="card">
        <h3>No Liked Posts</h3>
        <p>You haven't liked any posts yet. Start exploring and like some posts!</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Liked Posts</h2>
      {message && (
        <div className="card" style={{ 
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb'
        }}>
          {message}
        </div>
      )}
      {posts.map(post => (
        <div key={post._id} className="post">
          <div className="post-header">
            <img 
              src={post.createdBy.profilePic} 
              alt="" 
              className="post-avatar"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/40';
              }}
            />
            <div>
              <strong>{post.createdBy.username}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {new Date(post.created).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="post-content">
            {post.filetype && post.filetype.startsWith('image/') ? (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  📷 Image
                </div>
                <img src={post.url} alt="" style={{ maxWidth: '100%', borderRadius: '8px' }} />
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  🎥 Video
                </div>
                <video src={post.url} controls style={{ maxWidth: '100%', borderRadius: '8px' }} />
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LikedPostsLikeButton postId={post._id} onUnliked={handlePostUnliked} />
            <button className="btn" style={{padding: '6px 16px', fontSize: '0.95rem'}} onClick={() => setOpenCommentPostId(post._id)}>
              💬 Comments
            </button>
            <Modal isOpen={openCommentPostId === post._id} onClose={() => setOpenCommentPostId(null)}>
              <CommentSection postId={post._id} />
            </Modal>
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="card" style={{ textAlign: 'center' }}>
          Loading more posts...
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          No more liked posts to load
        </div>
      )}
    </div>
  );
};

// Custom LikeButton component for LikedPosts page
const LikedPostsLikeButton = ({ postId, onUnliked }) => {
  const [liked, setLiked] = useState(true); // Always starts as true since we're in liked posts
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      // Only unlike the post - remove from user's liked array
        await api.delete('/like', { data: { postId } });
        setLiked(false);
        // Call the callback to remove the post from the LikedPosts list
        if (onUnliked) {
          onUnliked(postId);
      }
    } catch (error) {
      console.error('Error unliking post:', error);
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
        backgroundColor: liked ? '#1877f2' : 'white',
        border: liked ? 'none' : '1px solid #ddd',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: loading ? 'not-allowed' : 'pointer',
        marginRight: '10px',
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
    >
      {loading ? '...' : (liked ? '\u2764\ufe0f Unlike' : '\ud83e\udd0d Liked')}
    </button>
  );
};

export default LikedPosts; 