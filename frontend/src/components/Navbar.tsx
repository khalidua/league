import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Navbar.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [moreDropdownPosition, setMoreDropdownPosition] = useState({ top: 0, left: 0 });
  const { isAuthenticated, user } = useAuth();
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const toggle = () => setOpen(v => !v);
  
  // Team management is for players with a team, not for admins
  const isTeamCaptain = !!user?.teamid && user?.role !== 'Admin';
  
  const handleMoreToggle = () => {
    if (!moreDropdownOpen && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setMoreDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
    setMoreDropdownOpen(!moreDropdownOpen);
  };

  // Close More dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownOpen && 
          moreButtonRef.current && 
          !moreButtonRef.current.contains(event.target as Node) &&
          moreDropdownRef.current &&
          !moreDropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreDropdownOpen]);

  return (
    <>
      {/* Fixed Navbar Wrapper */}
      <div className="nav-wrapper">
        <nav className={`Navbar ${open ? 'open' : ''}`}>
          {/* Left - Logo */}
          <div className="navbar-logo">
            <Link to="/" className="logo-link">
              <span className="logo-text">ZC</span>
              <span className="logo-league">LEAGUE</span>
            </Link>
          </div>

          {/* Center - Navigation Links */}
          <div className="nav-center">
            <div className="nav-links-desktop">
              <Link className="nav-item" to="/">{(user?.role || '').toLowerCase() === 'admin' ? 'Dashboard' : 'Home'}</Link>
              <Link className="nav-item" to="/teams">Teams</Link>
              <Link className="nav-item" to="/matches">Matches</Link>

              {/* Dropdown */}
              <div className="dropdown">
                <button ref={moreButtonRef} className="dropbtn" onClick={handleMoreToggle}>More ▼</button>
                {moreDropdownOpen && createPortal(
                  <div 
                    ref={moreDropdownRef}
                    className="dropdown-content"
                    style={{
                      position: 'fixed',
                      top: `${moreDropdownPosition.top}px`,
                      left: `${moreDropdownPosition.left}px`,
                      zIndex: 10000
                    }}
                  >
                    <Link to="/standings" onClick={() => setMoreDropdownOpen(false)}>Standings</Link>
                    <Link to="/players" onClick={() => setMoreDropdownOpen(false)}>Players</Link>
                    <Link to="/rules" onClick={() => setMoreDropdownOpen(false)}>Rules</Link>
                    {isTeamCaptain && (
                      <Link to="/team-management" onClick={() => setMoreDropdownOpen(false)}>Team Management</Link>
                    )}
                    {(user?.role || '').toLowerCase() === 'admin' && (
                      <Link to="/admin" onClick={() => setMoreDropdownOpen(false)}>Dashboard</Link>
                    )}
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>

          {/* Right - Auth or User Menu */}
          <div className="navbar-right">
            {isAuthenticated ? (
              <UserMenu className="usermenu" />
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="auth-btn login-btn">Login</Link>
                <Link to="/register" className="auth-btn register-btn">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`hamburger${open ? ' is-open' : ''}`}
            aria-label="Toggle navigation menu"
            onClick={toggle}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>

          {/* Mobile Menu */}
          <div id="mobile-menu" className="nav-links" role="menu">
            <Link className="nav-item" to="/" onClick={toggle}>{(user?.role || '').toLowerCase() === 'admin' ? 'Dashboard' : 'Home'}</Link>
            <Link className="nav-item" to="/teams" onClick={toggle}>Teams</Link>
            <Link className="nav-item" to="/matches" onClick={toggle}>Matches</Link>
            <Link className="nav-item" to="/standings" onClick={toggle}>Standings</Link>
            <Link className="nav-item" to="/players" onClick={toggle}>Players</Link>
            <Link className="nav-item" to="/rules" onClick={toggle}>Rules</Link>
            {isTeamCaptain && (
              <Link className="nav-item" to="/team-management" onClick={toggle}>Team Management</Link>
            )}
          </div>

          {/* Overlay when mobile menu open */}
          {open && <div className="nav-overlay" onClick={toggle} />}
        </nav>
      </div>
    </>
  );
};

export default Navbar;
