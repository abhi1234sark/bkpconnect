import React, { useState } from 'react';
import api from '../api';

const ProfilePicUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }

    // Check file size (5MB limit for profile pics)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/user', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update user data in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      currentUser.profilePic = response.data.profilePic;
      localStorage.setItem('user', JSON.stringify(currentUser));
      
      setMessage('Profile picture updated successfully!');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('profile-pic-input');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Upload Profile Picture</h2>
      <div style={{ marginBottom: '15px' }}>
        <input
          id="profile-pic-input"
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files[0])}
          style={{ marginBottom: '10px' }}
        />
        {file && (
          <div style={{ marginTop: '10px' }}>
            <strong>Selected file:</strong> {file.name}
            <br />
            <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
            <br />
            <strong>Type:</strong> {file.type}
            <br />
            <img 
              src={URL.createObjectURL(file)} 
              alt="Preview" 
              style={{ 
                maxWidth: '200px', 
                maxHeight: '200px', 
                borderRadius: '50%',
                marginTop: '10px'
              }} 
            />
          </div>
        )}
      </div>
      
      <button 
        className="btn" 
        onClick={handleUpload}
        disabled={loading || !file}
      >
        {loading ? 'Uploading...' : 'Upload Profile Picture'}
      </button>
      
      {message && (
        <div style={{ 
          marginTop: '10px', 
          color: message.includes('successfully') ? 'green' : 'red' 
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <p>Supported formats: JPG, PNG, GIF</p>
        <p>Maximum file size: 5MB</p>
      </div>
    </div>
  );
};

export default ProfilePicUpload; 