import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          AI Image Detector
        </Link>
        <ul className="navbar-nav">
          <li>
            <Link to="/features" className="navbar-link">
              Features
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
