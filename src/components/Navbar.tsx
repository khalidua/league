import React, { useState } from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(v => !v);
  return (
    <div className="nav-wrapper">
      <div className={`Navbar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="navbar-logo">
          <Link to="/" className="logo-link">
            <span className="logo-text">ZC</span>
            <span className="logo-league">LEAGUE</span>
          </Link>
        </div>

        <button
          className={`hamburger${open ? ' is-open' : ''}`}
          aria-label="Toggle navigation menu"
          aria-controls="mobile-menu"
          aria-expanded={open}
          onClick={toggle}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
        
        {/* Desktop Navigation */}
        <div className="nav-links-desktop">
          <Link className='nav-item' to="/">Home</Link>
          <Link className='nav-item' to="/teams">Teams</Link>
          <Link className='nav-item' to="/matches">Matches</Link>
          
          {/* Desktop Dropdown */}
          <div className="dropdown">
            <button className="dropbtn">More ▼</button>
            <div className="dropdown-content">
              <Link to="/standings">Standings</Link>
              <Link to="/players">Players</Link>
              <Link to="/news">News</Link>
              <Link to="/rules">Rules</Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div id="mobile-menu" className="nav-links" role="menu">
          <Link className='nav-item' role="menuitem" to="/" onClick={toggle}>Home</Link>
          <Link className='nav-item' role="menuitem" to="/teams" onClick={toggle}>Teams</Link>
          <Link className='nav-item' role="menuitem" to="/matches" onClick={toggle}>Matches</Link>
          <Link className='nav-item' role="menuitem" to="/standings" onClick={toggle}>Standings</Link>
          <Link className='nav-item' role="menuitem" to="/players" onClick={toggle}>Players</Link>
          <Link className='nav-item' role="menuitem" to="/schedule" onClick={toggle}>Schedule</Link>
          <Link className='nav-item' role="menuitem" to="/news" onClick={toggle}>News</Link>
          <Link className='nav-item' role="menuitem" to="/rules" onClick={toggle}>Rules</Link>
        </div>
        
        {open && <div className="nav-overlay" onClick={toggle} aria-hidden="true" />}
      </div>
    </div>
  );
};

export default Navbar;
