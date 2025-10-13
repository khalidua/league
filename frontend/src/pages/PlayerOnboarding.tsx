import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import './PlayerOnboarding.css';

type OnboardingData = {
  position?: string;
  preferredfoot?: string;
  height?: number;
  weight?: number;
  jerseynumber?: number;
};

const PlayerOnboarding: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({});

  const totalSteps = 3;

  const handleInputChange = (field: keyof OnboardingData, value: string | number) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create basic player stats first
      const statsResponse = await api.createPlayerStats({
        matchesplayed: 0,
        goals: 0,
        assists: 0,
        yellowcards: 0,
        redcards: 0,
        mvpcount: 0,
        ratingaverage: 0.0
      });
      
      // Create basic player record
      await api.createPlayer({
        userid: user?.userid!,
        statsid: statsResponse.statsid,
        position: null,
        preferredfoot: null,
        height: null,
        weight: null,
        jerseynumber: null
      });
      
      await refreshUser();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create player profile');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create player stats first
      const statsResponse = await api.createPlayerStats({
        matchesplayed: 0,
        goals: 0,
        assists: 0,
        yellowcards: 0,
        redcards: 0,
        mvpcount: 0,
        ratingaverage: 0.0
      });
      
      // Create player record with all provided data
      await api.createPlayer({
        userid: user?.userid!,
        statsid: statsResponse.statsid,
        position: data.position || null,
        preferredfoot: data.preferredfoot || null,
        height: data.height || null,
        weight: data.weight || null,
        jerseynumber: data.jerseynumber || null
      });
      
      await refreshUser();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create player profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <h2>Position & Role</h2>
        <p>Tell us about your playing position</p>
      </div>
      
      <div className="form-group">
        <label htmlFor="position">Playing Position</label>
        <select
          id="position"
          value={data.position || ''}
          onChange={(e) => handleInputChange('position', e.target.value)}
          className="form-select"
        >
          <option value="">Select your position</option>
          <option value="Goalkeeper">Goalkeeper</option>
          <option value="Defender">Defender</option>
          <option value="Midfielder">Midfielder</option>
          <option value="Forward">Forward</option>
          <option value="Winger">Winger</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="preferredfoot">Preferred Foot</label>
        <select
          id="preferredfoot"
          value={data.preferredfoot || ''}
          onChange={(e) => handleInputChange('preferredfoot', e.target.value)}
          className="form-select"
        >
          <option value="">Select your preferred foot</option>
          <option value="Left">Left</option>
          <option value="Right">Right</option>
          <option value="Both">Both</option>
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <h2>Physical Attributes</h2>
        <p>Help us understand your physical profile</p>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="height">Height (cm)</label>
          <input
            id="height"
            type="number"
            value={data.height || ''}
            onChange={(e) => handleInputChange('height', parseInt(e.target.value) || 0)}
            placeholder="e.g., 180"
            className="form-input"
            min="100"
            max="250"
          />
        </div>

        <div className="form-group">
          <label htmlFor="weight">Weight (kg)</label>
          <input
            id="weight"
            type="number"
            value={data.weight || ''}
            onChange={(e) => handleInputChange('weight', parseInt(e.target.value) || 0)}
            placeholder="e.g., 75"
            className="form-input"
            min="30"
            max="200"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <h2>Team Information</h2>
        <p>Your jersey number preference</p>
      </div>
      
      <div className="form-group">
        <label htmlFor="jerseynumber">Preferred Jersey Number</label>
        <input
          id="jerseynumber"
          type="number"
          value={data.jerseynumber || ''}
          onChange={(e) => handleInputChange('jerseynumber', parseInt(e.target.value) || 0)}
          placeholder="e.g., 10"
          className="form-input"
          min="1"
          max="99"
        />
        <small className="form-help">This can be changed later by your team admin</small>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>Welcome to ZC League!</h1>
          <p>Let's set up your player profile</p>
        </div>

        <div className="progress-bar">
          <div className="progress-steps">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i + 1}
                className={`progress-step ${i + 1 <= currentStep ? 'active' : ''}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="progress-line">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="onboarding-content">
          {renderCurrentStep()}
        </div>

        <div className="onboarding-actions">
          <div className="action-buttons">
            {currentStep > 1 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handlePrevious}
                disabled={loading}
              >
                Previous
              </button>
            )}
            
            <button
              type="button"
              className="btn-skip"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for now
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
                disabled={loading}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner color="white" size="sm" />
                    <span>Creating Profile...</span>
                  </>
                ) : (
                  'Complete Setup'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerOnboarding;
