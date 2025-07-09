import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import Modal from './Modal';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [openCommentPostId, setOpenCommentPostId] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/userprofile', { params: { userId } });
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [userId]);

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await api.get('/userprofile/posted', { 
        params: { userId, page: pageNum, limit: 10 } 
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
  }, [userId]);

  useEffect(() => {
    fetchProfile();
    setPage(1);
    fetchPosts(1, false);
  }, [userId, fetchProfile, fetchPosts]);

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

  const startChat = () => {
    navigate(`/chat/${userId}`);
  };

  if (!profile.username) {
    return (
      <div className="card">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <img 
            src={profile.profilePic} 
            alt="" 
            style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%',
              marginRight: '20px'
            }}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/100';
            }}
          />
          <div>
            <h2>{profile.username}</h2>
            <button className="btn btn-secondary" onClick={startChat}>
              Send Message
            </button>
          </div>
        </div>
      </div>

      <h3>Posts</h3>
      {posts.length === 0 && !loading ? (
        <div className="card">
          <p>No posts yet.</p>
        </div>
      ) : (
        posts.map(post => (
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
        ))
      )}
      
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

export default UserProfile; 