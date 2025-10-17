import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import settingsIco from '../assets/icons8-settings-24.png'
import ProfileIco from '../assets/icons8-profile-24.png'
import logoutIco from '../assets/icons8-logout-24.png'
import defaultPlayerPhoto from '../assets/defaultPlayer.png'
import { formatFullName } from '../utils/nameUtils';
import './UserMenu.css';

interface UserMenuProps {
  className?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && 
          buttonRef.current && 
          !buttonRef.current.contains(event.target as Node) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right
      });
    }
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    try {
      await api.deleteAccount();
      await logout();
      window.location.href = '/';
    } catch (e: any) {
      alert(e?.message || 'Failed to delete account');
    }
  };


  const fullName = (() => {
    const formattedName = formatFullName(user?.firstname, user?.lastname);
    return formattedName || user?.email || 'User';
  })();

  return (
    <div className={`user-menu ${className}`} ref={menuRef}>
      {/* Avatar Button */}
      <button 
        ref={buttonRef}
        className="user-avatar-btn" 
        onClick={handleToggle}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="user-avatar">
          <img 
            src={user?.profileimage || defaultPlayerPhoto} 
            alt={fullName}
            className="avatar-image"
          />
        </div>
      </button>

      {/* Dropdown Menu - Rendered via Portal */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="user-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            zIndex: 10000
          }}
        >
          <div className="user-info">
            <div className="user-avatar-large">
              <img 
                src={user?.profileimage || defaultPlayerPhoto} 
                alt={fullName}
                className="avatar-image"
              />
            </div>
            <div className="user-details">
              <div className="user-full-name">{fullName}</div>
              <div className="user-email">{user?.email}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>

          <div className="menu-divider"></div>

          <div className="menu-items">
            <Link to="/profile" className="menu-item" onClick={() => setIsOpen(false)}>
              <span className="menu-icon"><img src={ProfileIco}/></span>
              <span>Profile</span>
            </Link>
            {/* Show team management only for players with a team (not Admins) */}
            {user?.role !== 'Admin' && user?.teamid && (
              <Link to="/team-management" className="menu-item" onClick={() => setIsOpen(false)}>
                <span className="menu-icon">⚽</span>
                <span>Manage Team</span>
              </Link>
            )}
            <button className="menu-item">
              <span className="menu-icon"><img src={settingsIco}/></span>
              <span>Settings</span>
            </button>
          </div>

          <div className="menu-divider"></div>

          <button className="menu-item logout-item" onClick={handleLogout}>
            <span className="menu-icon"><img src={logoutIco}/></span>
            <span>Logout</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserMenu;
