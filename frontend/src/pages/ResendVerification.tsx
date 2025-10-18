import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import './Auth.css';

const ResendVerification: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);

  // Cooldown timer effect
  useEffect(() => {
    let interval: number;
    if (cooldownActive && cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            setCooldownActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownActive, cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.resendVerification(email);
      setEmailSent(true);
      setMessage('If the email exists and is not verified, a verification email has been sent.');
      // Start 60-second cooldown
      setCooldown(60);
      setCooldownActive(true);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to resend verification email';
      setError(errorMessage);
      
      // Check if it's a cooldown error and extract the remaining time
      if (errorMessage.includes('Please wait') && errorMessage.includes('seconds')) {
        const match = errorMessage.match(/(\d+)\s+seconds/);
        if (match) {
          const remainingSeconds = parseInt(match[1]);
          setCooldown(remainingSeconds);
          setCooldownActive(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Resend Verification Email</h1>
          <p>Enter your email address to receive a new verification link</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {message && (
            <div style={{ 
              color: '#27ae60', 
              backgroundColor: '#d5f4e6', 
              padding: '1rem', 
              borderRadius: '4px', 
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}

          {!emailSent ? (
            <>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                />
              </div>

              <button 
                type="submit" 
                className="auth-button" 
                disabled={loading || cooldownActive}
              >
                {loading ? (
                  <>
                    <Spinner color="white" size="sm" />
                    <span>Sending...</span>
                  </>
                ) : cooldownActive ? (
                  `Wait ${cooldown}s before resending`
                ) : (
                  'Send Verification Email'
                )}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#27ae60', marginBottom: '1.5rem' }}>
                Verification email sent! Please check your inbox and spam folder.
              </p>
              {cooldownActive && (
                <p style={{ color: '#f39c12', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  You can request another email in {cooldown} seconds.
                </p>
              )}
              <Link to="/login" className="auth-button">
                Go to Login
              </Link>
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;
