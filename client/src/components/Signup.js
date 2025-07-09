import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = ({ onSignup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!username.trim() || !password.trim()) {
      setMsg('Please fill in all fields');
      return;
    }

    try {
      const response = await axios.post('https://bkpconnect.onrender.com/auth/signup', { 
        username, 
        password 
      });
      
      setMsg('Signup successful! You can now log in.');
      setUsername('');
      setPassword('');
      
      if (onSignup) onSignup();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="card">
      <h2>Signup</h2>
      <input 
        className="input"
        placeholder="Username" 
        value={username} 
        onChange={e => setUsername(e.target.value)} 
      />
      <input 
        className="input"
        placeholder="Password" 
        type="password" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
      />
      <button className="btn" onClick={handleSignup}>Signup</button>
      <div style={{ marginTop: '10px', color: msg.includes('successful') ? 'green' : 'red' }}>
        {msg}
      </div>
    </div>
  );
};

export default Signup; 
