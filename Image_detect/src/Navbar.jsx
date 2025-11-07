import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ isAuthenticated, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          AI Image Detector
        </Link>
        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to="/detect" className="navbar-link">
                Detect
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/signup" className="navbar-link">
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
