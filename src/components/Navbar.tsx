import React, { useState } from 'react';
import './Navbar.css';

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(v => !v);
  return (
    <div className="nav-wrapper">
      <div className={`Navbar ${open ? 'open' : ''}`}>
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
        <div id="mobile-menu" className="nav-links" role="menu">
          {/* Main sections */}
          <a className='nav-item' role="menuitem" href="/">Home</a>
          <a className='nav-item' role="menuitem" href="/teams">Teams</a>
          <a className='nav-item' role="menuitem" href="/matches">Matches</a>

          {/* Dropdown menu */}
          <div className="dropdown">
            <button className="dropbtn">More ▼</button>
            <div className="dropdown-content">
              <a href="/standings">Standings</a>
              <a href="/players">Players</a>
              <a href="/schedule">Schedule</a>
              <a href="/news">News</a>
              <a href="/rules">Rules</a>
            </div>
          </div>
        </div>
        {open && <div className="nav-overlay" onClick={toggle} aria-hidden="true" />}
      </div>
    </div>
  );
};

export default Navbar;
