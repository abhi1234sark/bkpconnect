import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('https://bkpconnect.onrender.com/api');

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
  const [targetUser, setTargetUser] = useState(null);
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
      
      let fileUrl = null, fileType = null;
      if (file) {
        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_PRESET || 'ml_default');
        
        const resp = await axios.post(
          `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'demo'}/auto/upload`, 
          formData
        );
        fileUrl = resp.data.secure_url;
        fileType = file.type;
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
      
      // Reset file input
      const fileInput = document.getElementById('chat-file-input');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
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
            onChange={e => setFile(e.target.files[0])}
            style={{ marginRight: '10px' }}
          />
          <button 
            className="btn" 
            onClick={handleSend}
            disabled={loading || (!text.trim() && !file)}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
      
      {file && (
        <div className="card" style={{ marginTop: '10px' }}>
          <strong>Selected file:</strong> {file.name}
          <br />
          <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
          <br />
          <strong>Type:</strong> {file.type}
        </div>
      )}
    </div>
  );
};

export default ChatRoom; 
