import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import './Auth.css';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        setLoading(false);
        return;
      }

      try {
        const response = await api.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
      } catch (error: any) {
        if (error.message?.includes('expired')) {
          setStatus('expired');
          setMessage('Verification token has expired. Please request a new verification email.');
        } else {
          setStatus('error');
          setMessage(error.message || 'Failed to verify email');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendVerification = async () => {
    // We need to get the email from the user somehow
    // For now, we'll redirect to a resend page
    navigate('/resend-verification');
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Verifying Email</h1>
            <p>Please wait while we verify your email address...</p>
          </div>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner color="#3498db" size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>
            {status === 'success' && '✅ Email Verified!'}
            {status === 'error' && '❌ Verification Failed'}
            {status === 'expired' && '⏰ Token Expired'}
          </h1>
          <p>{message}</p>
        </div>

        <div className="auth-form">
          {status === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#27ae60', marginBottom: '1.5rem' }}>
                Your email has been successfully verified! You can now log in to your account.
              </p>
              <Link to="/login" className="auth-button" style={{ display: 'inline-block' }}>
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#e74c3c', marginBottom: '1.5rem' }}>
                There was an error verifying your email. The token may be invalid or already used.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  onClick={handleResendVerification}
                  className="auth-button"
                >
                  Resend Verification
                </button>
                <Link to="/register" className="auth-button" style={{ background: '#95a5a6' }}>
                  Register Again
                </Link>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#f39c12', marginBottom: '1.5rem' }}>
                Your verification link has expired. Please request a new one.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  onClick={handleResendVerification}
                  className="auth-button"
                >
                  Resend Verification
                </button>
                <Link to="/login" className="auth-button" style={{ background: '#95a5a6' }}>
                  Go to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="auth-footer">
          <p>
            Need help?{' '}
            <Link to="/" className="auth-link">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
