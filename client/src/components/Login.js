import React, { useState } from 'react';
import axios from 'axios';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setMsg('Please fill in all fields');
      return;
    }

    try {
      const res = await axios.post('https://bkpconnect.onrender.com/auth/login/api', { 
        username, 
        password 
      });
      
      const userData = {
        ...res.data.user,
        token: res.data.token
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setMsg('Login successful!');

      // Call /sentreq with JWT token
      try {
        await api.post('/sentreq', {});
      } catch (err) {
        console.log('SentReq creation failed:', err);
      }

      if (onLogin) onLogin(userData);
      
      // Redirect to main path after successful login
      navigate('/');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
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
      <button className="btn" onClick={handleLogin}>Login</button>
      <div style={{ marginTop: '10px', color: msg.includes('successful') ? 'green' : 'red' }}>
        {msg}
      </div>
      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <p>Don't have an account?</p>
        <button 
          className="btn" 
          onClick={() => navigate('/signup')}
          style={{ 
            backgroundColor: '#28a745', 
            border: 'none',
            marginTop: '5px'
          }}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Login; 
