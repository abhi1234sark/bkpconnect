import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import Modal from './Modal';

const Feed = ({ type = 'all' }) => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [openCommentPostId, setOpenCommentPostId] = useState(null);

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await api.get('/posts', { 
        params: { page: pageNum, type, limit: 10 } 
      });
      
      const newPosts = response.data.posts;
      
      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(newPosts.length === 10);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [type, fetchPosts]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
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

  if (posts.length === 0 && !loading) {
    return (
      <div className="card">
        <h3>No posts found</h3>
        <p>Follow some friends to see their posts here!</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Feed</h2>
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
            <LikeButton postId={post._id} />
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
          No more posts to load
        </div>
      )}
    </div>
  );
};

export default Feed; 