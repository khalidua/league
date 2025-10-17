import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api, getApiUrl } from '../api/client';
import './Profile.css';
import Spinner from '../components/Spinner';
import editIcon from '../assets/icons8-edit-24.png';
import deleteIcon from '../assets/delete.png';
import defaultPlayerPhoto from '../assets/defaultPlayer.png';
import { formatFullName, capitalizeFirstLetter } from '../utils/nameUtils';

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{count}</span>;
};

const Profile: React.FC = () => {
  const { user, updateUser, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    role: '',
    teamname: '',
    profileimage: '',
    // Player-specific fields
    position: '',
    jerseynumber: '',
    preferredfoot: '',
    height: '',
    weight: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        role: user.role || '',
        teamname: user.teamname || '',
        profileimage: user.profileimage || '',
        // Player-specific fields
        position: user.position || '',
        jerseynumber: user.jerseynumber?.toString() || '',
        preferredfoot: user.preferredfoot || '',
        height: user.height?.toString() || '',
        weight: user.weight?.toString() || ''
      });
    }
  }, [user]);

  // Fetch player stats for players
  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (user?.role === 'Player' && user?.userid) {
        setStatsLoading(true);
        try {
          // First, get the player record to find the statsid
          const players = await api.listPlayers();
          const player = players.find((p: any) => p.userid === user.userid);

          if (player && player.statsid) {
            // Get the specific stats record
            const stats = await api.getPlayerStats(player.statsid);
            setPlayerStats(stats);
          } else {
            // No player record or no stats linked
            setPlayerStats({
              matchesplayed: 0,
              goals: 0,
              assists: 0,
              yellowcards: 0,
              redcards: 0,
              mvpcount: 0,
              ratingaverage: 0
            });
          }
        } catch (error) {
          console.error('Failed to fetch player stats:', error);
          // Set default stats if fetch fails
          setPlayerStats({
            matchesplayed: 0,
            goals: 0,
            assists: 0,
            yellowcards: 0,
            redcards: 0,
            mvpcount: 0,
            ratingaverage: 0
          });
        } finally {
          setStatsLoading(false);
        }
      }
    };

    fetchPlayerStats();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Call the API to update user profile
      const updatedUser = await api.updateProfile({
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        role: formData.role,
        profileimage: formData.profileimage,
        // Player-specific fields
        position: formData.position || null,
        jerseynumber: formData.jerseynumber ? parseInt(formData.jerseynumber) : null,
        preferredfoot: formData.preferredfoot || null,
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null
      });

      // Update the user data in context
      updateUser(updatedUser);

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        role: user.role || '',
        teamname: user.teamname || '',
        profileimage: user.profileimage || '',
        // Player-specific fields
        position: user.position || '',
        jerseynumber: user.jerseynumber?.toString() || '',
        preferredfoot: user.preferredfoot || '',
        height: user.height?.toString() || '',
        weight: user.weight?.toString() || ''
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading profile image:', file.name, file.type, file.size);

      const response = await fetch(getApiUrl('/upload'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);

      // Update user profile with new image URL
      const updatedUser = await api.updateProfile({
        profileimage: result.image_url
      });

      // Update the user data in context
      updateUser(updatedUser);

      setSuccess('Profile picture updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Failed to upload profile picture: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!user) return;

    setUploading(true);
    setError(null);

    try {
      // Delete profile image and restore to default
      console.log('Deleting profile picture and restoring default...');
      await api.deleteProfileImage();

      // Get updated user data
      const updatedUser = await api.getCurrentUser();
      console.log('Updated user after deletion:', updatedUser);

      // Update the user data in context
      updateUser(updatedUser);

      setSuccess('Profile picture removed and restored to default!');
    } catch (error) {
      console.error('Delete error:', error);
      setError(`Failed to remove profile picture: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };


  if (loading) {
    return (
      <div className="ProfilePage">
        <div className="profile-loading">
          <Spinner color="white" size="lg" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ProfilePage">
        <div className="profile-loading">
          <Spinner color="white" size="lg" />
          <p>Please log in to view your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ProfilePage">
      <div className="profile-strap">PROFILE</div>

      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-container">
              <div className="profile-avatar">
                {uploading ? (
                  <div className="avatar-loading">
                    <Spinner color="white" size="md" />
                  </div>
                ) : (
                  <img
                    src={user.profileimage || defaultPlayerPhoto}
                    alt={formatFullName(user.firstname, user.lastname)}
                    className="avatar-image"
                  />
                )}
              </div>
              <div className="profile-avatar-actions">
                <button
                  className="edit-avatar-btn"
                  onClick={handleUploadClick}
                  disabled={uploading}
                  title="Edit profile picture"
                >
                  <img src={editIcon} alt="Edit" width="16" height="16" style={{ filter: 'brightness(0) invert(1)' }} />
                </button>
                {user.profileimage && user.profileimage !== "https://res.cloudinary.com/dns6zhmc2/image/upload/v1760475598/defaultPlayer_vnbpfb.png" && (
                  <button
                    className="delete-avatar-btn"
                    onClick={handleDeleteProfilePicture}
                    disabled={uploading}
                    title="Remove profile picture"
                  >
                    <img src={deleteIcon} alt="Delete" width="16" height="16" style={{ filter: 'brightness(0) invert(1)' }} />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden-file-input"
              />
            </div>
            <div className="profile-basic-info">
              <h2>{formatFullName(user.firstname, user.lastname) || user.email}</h2>
              <div className="profile-role">
                <span className={`role-badge role-${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
                {user.teamname && (
                  <span className="team-badge">
                    {user.teamname}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="profile-actions">
              <div className="edit-actions">
                <button
                  className="save-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Spinner color="white" size="sm" /> : 'Save Changes'}
                </button>
                <button
                  className="cancel-btn"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          <div className="details-section">
            <h3>Personal Information {!isEditing && (
              <span
                className="edit-profile-link"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </span>
            )}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstname">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    id="firstname"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your first name"
                  />
                ) : (
                  <div className="form-display">
                    {capitalizeFirstLetter(user.firstname) || 'Not provided'}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastname">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    id="lastname"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your last name"
                  />
                ) : (
                  <div className="form-display">
                    {capitalizeFirstLetter(user.lastname) || 'Not provided'}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email"
                  />
                ) : (
                  <div className="form-display">
                    {user.email}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                {isEditing ? (
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="Player">Player</option>
                    <option value="Admin">Admin</option>
                    <option value="Organizer">Organizer</option>
                    <option value="Coach">Coach</option>
                  </select>
                ) : (
                  <div className="form-display">
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Information (for players) */}
          {user.role === 'Player' && (
            <div className="details-section">
              <h3>Team Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="teamname">Team</label>
                  <div className="form-display">
                    {user.teamname ? (
                      <span className="team-badge">
                        {user.teamname}
                      </span>
                    ) : (
                      <span className="no-team">No team assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Player Details (for players) */}
          {user.role === 'Player' && (
            <div className="details-section">
              <h3>Player Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="position">Position</label>
                  {isEditing ? (
                    <select
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Select Position</option>
                      <option value="Goalkeeper">Goalkeeper</option>
                      <option value="Defender">Defender</option>
                      <option value="Midfielder">Midfielder</option>
                      <option value="Forward">Forward</option>
                    </select>
                  ) : (
                    <div className="form-display">
                      <span className="player-detail">
                        {user.position || 'Not specified'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="jerseynumber">Jersey Number</label>
                  {isEditing ? (
                    <input
                      type="number"
                      id="jerseynumber"
                      name="jerseynumber"
                      value={formData.jerseynumber}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter jersey number"
                      min="1"
                      max="99"
                    />
                  ) : (
                    <div className="form-display">
                      <span className="player-detail">
                        {user.jerseynumber ? `#${user.jerseynumber}` : 'Not assigned'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="preferredfoot">Preferred Foot</label>
                  {isEditing ? (
                    <select
                      id="preferredfoot"
                      name="preferredfoot"
                      value={formData.preferredfoot}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Select Preferred Foot</option>
                      <option value="Right">Right</option>
                      <option value="Left">Left</option>
                      <option value="Both">Both</option>
                    </select>
                  ) : (
                    <div className="form-display">
                      <span className="player-detail">
                        {user.preferredfoot || 'Not specified'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="height">Height (cm)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      id="height"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter height in cm"
                      min="150"
                      max="220"
                    />
                  ) : (
                    <div className="form-display">
                      <span className="player-detail">
                        {user.height ? `${user.height} cm` : 'Not specified'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="weight">Weight (kg)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter weight in kg"
                      min="50"
                      max="120"
                    />
                  ) : (
                    <div className="form-display">
                      <span className="player-detail">
                        {user.weight ? `${user.weight} kg` : 'Not specified'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Player Statistics (for players) */}
          {user.role === 'Player' && (
            <div className="details-section">
              <h3>Player Statistics</h3>
              {statsLoading ? (
                <div className="stats-loading">
                  <Spinner color="white" size="md" />
                  <p>Loading your stats...</p>
                </div>
              ) : (
                <div className="stats-grid">
                  <div className="stat-card stat-primary">
                    <div className="stat-icon">⚽</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        <AnimatedCounter value={playerStats?.goals || 0} />
                      </div>
                      <div className="stat-label">Goals</div>
                    </div>
                  </div>

                  <div className="stat-card stat-success">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        <AnimatedCounter value={playerStats?.mvpcount || 0} />
                      </div>
                      <div className="stat-label">MVP Awards</div>
                    </div>
                  </div>

                  <div className="stat-card stat-info">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        <AnimatedCounter value={playerStats?.matchesplayed || 0} />
                      </div>
                      <div className="stat-label">Matches Played</div>
                    </div>
                  </div>

                  <div className="stat-card stat-warning">
                    <div className="stat-icon">🟨</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        <AnimatedCounter value={playerStats?.yellowcards || 0} />
                      </div>
                      <div className="stat-label">Yellow Cards</div>
                    </div>
                  </div>

                  <div className="stat-card stat-danger">
                    <div className="stat-icon">🟥</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        <AnimatedCounter value={playerStats?.redcards || 0} />
                      </div>
                      <div className="stat-label">Red Cards</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Information */}
          <div className="details-section">
            <h3>Account Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>User ID</label>
                <div className="form-display">
                  {user.userid}
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <div className="form-display">
                  <span className={`status-badge status-${user.status}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="message error">
            {error}
          </div>
        )}
        {success && (
          <div className="message success">
            {success}
          </div>
        )}

        {/* Delete Account Section */}
        <div className="delete-account-section">
          <div className="delete-account-content">
            <div className="delete-account-info">
              <h4>Delete Account</h4>
              <p>Once you delete your account, there is no going back. Please be certain.</p>
            </div>
            <button
              className="delete-account-btn"
              onClick={async () => {
                if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
                try {
                  await api.deleteAccount();
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('token');
                  window.location.href = '/';
                } catch (e: any) {
                  alert(e?.message || 'Failed to delete account');
                }
              }}
              disabled={loading}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
