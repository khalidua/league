import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import PasswordInput from '../components/PasswordInput';
import './Auth.css';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  // Player-only registration; optional player fields
  const [position, setPosition] = useState('');
  const [jerseynumber, setJerseynumber] = useState('');
  const [preferredfoot, setPreferredfoot] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      await register(email, password, firstname, lastname, {
        position: position || undefined,
        jerseynumber: jerseynumber ? Number(jerseynumber) : undefined,
        preferredfoot: preferredfoot || undefined,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Join ZC League</h1>
          <p>Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          {step === 1 ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstname">First Name</label>
                  <input id="firstname" type="text" value={firstname} onChange={(e) => setFirstname(e.target.value)} placeholder="Enter your first name" />
                </div>
                <div className="form-group">
                  <label htmlFor="lastname">Last Name</label>
                  <input id="lastname" type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} placeholder="Enter your last name" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <PasswordInput id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm your password" />
              </div>
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? (<><Spinner color="white" size="sm" /><span>Next...</span></>) : ('Next')}
              </button>
            </>
          ) : (
            <>
              {/* Optional player onboarding fields */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="position">Position (optional)</label>
                  <select
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  >
                    <option value="">Select position</option>
                    <option value="GK">Goalkeeper</option>
                    <option value="DEF">Defender</option>
                    <option value="MID">Midfielder</option>
                    <option value="FWD">Forward</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="jerseynumber">Jersey Number (optional)</label>
                  <input id="jerseynumber" type="number" value={jerseynumber} onChange={(e) => setJerseynumber(e.target.value)} placeholder="e.g., 10" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="preferredfoot">Preferred Foot (optional)</label>
                  <select
                    id="preferredfoot"
                    value={preferredfoot}
                    onChange={(e) => setPreferredfoot(e.target.value)}
                  >
                    <option value="">Select foot</option>
                    <option value="Right">Right</option>
                    <option value="Left">Left</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="height">Height (cm, optional)</label>
                  <input id="height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g., 180" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="weight">Weight (kg, optional)</label>
                  <input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g., 75" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="auth-button" onClick={() => setStep(1)} disabled={loading}>Back</button>
                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? (<><Spinner color="white" size="sm" /><span>Creating Account...</span></>) : ('Create Account')}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
