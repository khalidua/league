import React from 'react';
import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'white' }) => {
  const sizeClass = `spinner-${size}`;
  
  // For white color, use explicit white instead of currentColor
  const spinnerStyle = color === 'white' 
    ? { borderColor: 'white', borderRightColor: 'transparent' }
    : { color };
  
  return (
    <div className={`spinner-border ${sizeClass}`} style={spinnerStyle} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
};

export default Spinner;
