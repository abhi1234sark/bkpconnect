import React, { useState } from 'react';
import api from '../api';

const PostUploader = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setMessage('Please select an image or video file');
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('File size must be less than 10MB');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const formData = new FormData();
      formData.append('file', file);
      
      await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setMessage('Post uploaded successfully!');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Upload Post</h2>
      <div style={{ marginBottom: '15px' }}>
        <input
          id="file-input"
          type="file"
          accept="image/*,video/*"
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
          </div>
        )}
      </div>
      
      <button 
        className="btn" 
        onClick={handleUpload}
        disabled={loading || !file}
      >
        {loading ? 'Uploading...' : 'Upload Post'}
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
        <p>Supported formats: JPG, PNG, GIF, MP4, MOV, AVI</p>
        <p>Maximum file size: 10MB</p>
      </div>
    </div>
  );
};

export default PostUploader; 