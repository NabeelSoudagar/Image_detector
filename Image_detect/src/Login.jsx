import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/login', formData);
      // Assuming login is successful, store token and redirect
      localStorage.setItem('token', response.data.token);
      onLogin();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" style={{color: '#fff'}}>Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              borderRadius: '8px',
              padding: '0.5rem',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div>
          <label htmlFor="password" style={{color: '#fff'}}>Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              borderRadius: '8px',
              padding: '0.5rem',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      <p style={{color: '#fff'}}>
        Don't have an account? <a href="/signup" style={{color: '#fff', textDecoration: 'underline'}}>Sign up here</a>
      </p>
    </div>
  );
}

export default Login;
