import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import './Auth.css';

const VerifyEmailSuccess: React.FC = () => {
  const location = useLocation();
  const { email, message } = location.state || {};
  const [cooldown, setCooldown] = useState(60);
  const [cooldownActive, setCooldownActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  
  // Check if user came from verification link
  const urlParams = new URLSearchParams(location.search);
  const isVerified = urlParams.get('verified') === 'true';

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

  const handleResend = async () => {
    if (!email) return;
    
    setLoading(true);
    setResendError('');
    setResendMessage('');

    try {
      await api.resendVerification(email);
      setResendMessage('Verification email sent! Please check your inbox.');
      setCooldown(60);
      setCooldownActive(true);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to resend verification email';
      setResendError(errorMessage);
      
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
          <h1>{isVerified ? '✅ Email Verified!' : '🎉 Registration Successful!'}</h1>
          <p>{isVerified ? 'Your email has been successfully verified!' : 'We\'ve sent a verification email to your inbox'}</p>
        </div>

        <div className="auth-form">
          {isVerified ? (
            <div style={{ 
              background: 'rgba(30, 147, 171, 0.1)',
              border: '1px solid rgba(30, 147, 171, 0.2)',
              padding: '1.5rem', 
              borderRadius: '12px', 
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <h3 style={{ 
                color: '#1E93AB', 
                marginBottom: '1rem',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                Welcome to ZC League!
              </h3>
              <p style={{ 
                color: 'rgba(243, 242, 236, 0.8)', 
                marginBottom: '1rem',
                fontSize: '0.95rem'
              }}>
                Your account is now active and ready to use.
              </p>
              <p style={{ 
                color: 'rgba(243, 242, 236, 0.7)', 
                fontSize: '0.9rem',
                margin: 0
              }}>
                You can now log in and start playing!
              </p>
            </div>
          ) : (
            <div style={{ 
              background: 'rgba(30, 147, 171, 0.1)',
              border: '1px solid rgba(30, 147, 171, 0.2)',
              padding: '1.5rem', 
              borderRadius: '12px', 
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <h3 style={{ 
                color: '#1E93AB', 
                marginBottom: '1rem',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                Check Your Email
              </h3>
              <p style={{ 
                color: 'rgba(243, 242, 236, 0.8)', 
                marginBottom: '1rem',
                fontSize: '0.95rem'
              }}>
                We've sent a verification link to:
              </p>
              <div style={{ 
                background: 'rgba(30, 147, 171, 0.2)',
                border: '1px solid rgba(30, 147, 171, 0.3)',
                color: '#F3F2EC',
                padding: '0.75rem 1rem', 
                borderRadius: '8px',
                marginBottom: '1rem',
                fontWeight: '600',
                wordBreak: 'break-all'
              }}>
                {email || 'your email address'}
              </div>
              <p style={{ 
                color: 'rgba(243, 242, 236, 0.7)', 
                fontSize: '0.9rem',
                margin: 0
              }}>
                Click the verification link in the email to activate your account.
              </p>
            </div>
          )}

          {!isVerified && (
            <>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem'
              }}>
                <p style={{ 
                  color: 'rgba(243, 242, 236, 0.7)', 
                  fontSize: '0.9rem', 
                  margin: 0,
                  fontWeight: '500'
                }}>
                  <strong>Don't see the email?</strong> Check your spam folder or wait a few minutes for it to arrive.
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                {resendMessage && (
                  <div style={{ 
                    background: 'rgba(30, 147, 171, 0.1)',
                    border: '1px solid rgba(30, 147, 171, 0.3)',
                    color: '#1E93AB',
                    padding: '1rem', 
                    borderRadius: '8px', 
                    marginBottom: '1rem',
                    fontWeight: '500'
                  }}>
                    ✅ {resendMessage}
                  </div>
                )}
                
                {resendError && (
                  <div style={{ 
                    background: 'rgba(196, 13, 60, 0.1)',
                    border: '1px solid rgba(196, 13, 60, 0.3)',
                    color: 'rgb(196, 13, 60)',
                    padding: '1rem', 
                    borderRadius: '8px', 
                    marginBottom: '1rem',
                    fontWeight: '500'
                  }}>
                    ❌ {resendError}
                  </div>
                )}
                
                <button 
                  onClick={handleResend}
                  className="auth-button" 
                  style={{ 
                    background: cooldownActive 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'linear-gradient(135deg, #1E93AB 0%, #0f3460 100%)',
                    border: cooldownActive ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                    color: cooldownActive ? 'rgba(243, 242, 236, 0.6)' : 'white',
                    padding: '10px 20px',
                    fontSize: '0.9rem',
                    maxWidth: '280px',
                    margin: '0 auto'
                  }}
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
                    'Resend Verification Email'
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="auth-footer">
          <p>
            {isVerified ? (
              <>
                Ready to play?{' '}
                <Link to="/login" className="auth-link">
                  Sign in here
                </Link>
              </>
            ) : (
              <>
                Already verified?{' '}
                <Link to="/login" className="auth-link">
                  Sign in here
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailSuccess;
