import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('https://bkpconnect.onrender.com/');

function getRoomId(user1, user2) {
  return [user1, user2].sort().join('_');
}

const ChatRoom = () => {
  const { userId } = useParams();
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [targetUser, setTargetUser] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);
  
  const roomId = getRoomId(currentUser.id, userId);

  useEffect(() => {
    // Fetch target user info
    const fetchTargetUser = async () => {
      try {
        const response = await axios.get(`https://bkpconnect.onrender.com/api/userprofile?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        });
        setTargetUser(response.data);
      } catch (error) {
        console.error('Error fetching target user:', error);
      }
    };

    fetchTargetUser();

    // Join chat room
    socket.emit('joinRoom', roomId);

    // Fetch chat history
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`https://bkpconnect.onrender.com/api/chat/${roomId}`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        });
        setMessages(response.data.messages);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchChatHistory();

    // Listen for new messages
    socket.on('messageReceived', ({ roomId: incomingRoomId, message }) => {
      if (incomingRoomId === roomId) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      socket.off('messageReceived');
    };
  }, [roomId, currentUser, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((!text.trim() && !file) || loading) return;

    try {
      setLoading(true);
      setUploadProgress(0);
      
      let fileUrl = null, fileType = null;
      if (file) {
        // File size check (50MB max for videos - testing smaller limit)
        const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        console.log('File size check:', {
          fileName: file.name,
          fileSize: file.size,
          fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
          maxSize: maxSize,
          maxSizeMB: (maxSize / 1024 / 1024).toFixed(2),
          fileType: file.type
        });
        
        if (file.size > maxSize) {
          alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
          setLoading(false);
          setUploadProgress(0);
          return;
        }
        
        // Upload to backend (which uploads to Cloudinary)
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('Starting upload to backend...');
        console.log('File:', file.name, file.size, file.type);
        
        // Warn user about large files
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        if (file.size > 20 * 1024 * 1024) { // 20MB
          console.log(`Large file detected: ${fileSizeMB}MB. Upload may take several minutes...`);
        }
        
        // Create abort controller for cancelling upload
        const controller = new AbortController();
        setAbortController(controller);
        
        // Create axios instance with timeout and progress tracking
        const axiosInstance = axios.create({
          timeout: 600000, // 10 minutes timeout for large videos
        });
        
        const resp = await axiosInstance.post(
          'http://localhost:5000/api/chat/upload',
          formData,
          {
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
              'Content-Type': 'multipart/form-data',
            },
            signal: controller.signal,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            },
          }
        );
        
        console.log('Upload response:', resp.data);
        fileUrl = resp.data.url;
        fileType = resp.data.filetype;
      }

      const message = {
        admin: currentUser.id,
        text: text.trim(),
        fileUrl,
        fileType,
      };
      
      socket.emit('sendMessage', { roomId, message });
      setText('');
      setFile(null);
      setUploadProgress(0);
      setAbortController(null);
      
      // Reset file input
      const fileInput = document.getElementById('chat-file-input');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message || error);
      
      let errorMessage = 'Failed to send message';
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out after 10 minutes. Try with a smaller file or check your internet connection.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        console.log('Backend error details:', error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('Full error object:', error);
      
      alert(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setAbortController(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderFile = (msg) => {
    if (!msg.fileUrl) return null;
    
    if (msg.fileType && msg.fileType.startsWith('image/')) {
      return <img src={msg.fileUrl} alt="" style={{ maxWidth: '200px', borderRadius: '8px', marginTop: '5px' }} />;
    }
    if (msg.fileType && msg.fileType.startsWith('video/')) {
      return <video src={msg.fileUrl} controls style={{ maxWidth: '300px', borderRadius: '8px', marginTop: '5px' }} />;
    }
    if (msg.fileType && msg.fileType.startsWith('audio/')) {
      return <audio src={msg.fileUrl} controls style={{ marginTop: '5px' }} />;
    }
    
    // For documents and other files
    return (
      <a 
        href={msg.fileUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          display: 'block', 
          marginTop: '5px',
          color: '#1877f2',
          textDecoration: 'none'
        }}
      >
        📎 Download File
      </a>
    );
  };

  if (!targetUser) {
    return (
      <div className="card">
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h3>Chat with {targetUser.username}</h3>
      </div>
      
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className="message">
              <div className="message-header">
                {msg.admin && (
                  <>
                    <img 
                      src={msg.admin.profilePic || 'https://via.placeholder.com/30'} 
                      alt="" 
                      className="message-avatar"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/30';
                      }}
                    />
                    <strong>{msg.admin.username}</strong>
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
              {msg.text && <div>{msg.text}</div>}
              {renderFile(msg)}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input">
          <input
            className="input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={{ marginBottom: 0 }}
          />
          <input
            id="chat-file-input"
            type="file"
            accept="image/*,video/*,audio/*,.txt,.pdf,.doc,.docx,.csv,.json"
            onChange={e => {
              const selectedFile = e.target.files[0];
              if (selectedFile) {
                // Validate file type
                const allowedTypes = [
                  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml',
                  'video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv',
                  'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/flac',
                  'text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'text/csv', 'application/json'
                ];
                
                if (!allowedTypes.includes(selectedFile.type)) {
                  alert('Invalid file type. Only images, videos, audio, and documents are allowed.');
                  e.target.value = '';
                  return;
                }
                
                setFile(selectedFile);
              }
            }}
            style={{ marginRight: '10px' }}
          />
          <button 
            className="btn" 
            onClick={handleSend}
            disabled={loading || (!text.trim() && !file)}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
          {loading && abortController && (
            <button 
              className="btn" 
              onClick={() => {
                abortController.abort();
                setLoading(false);
                setUploadProgress(0);
                setAbortController(null);
              }}
              style={{ marginLeft: '10px', backgroundColor: '#dc3545' }}
            >
              Cancel
            </button>
          )}
          {loading && file && file.size > 20 * 1024 * 1024 && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              ⚠️ Large file upload in progress. This may take several minutes...
            </div>
          )}
        </div>
      </div>
      
      {file && (
        <div className="card" style={{ marginTop: '10px' }}>
          <strong>Selected file:</strong> {file.name}
          <br />
          <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
          <br />
          <strong>Type:</strong> {file.type}
          {loading && uploadProgress > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ 
                width: '100%', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '20px',
                  backgroundColor: '#1877f2',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '12px' }}>
                Uploading... {uploadProgress}%
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatRoom; 
