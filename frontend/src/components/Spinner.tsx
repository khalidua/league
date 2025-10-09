import React from 'react';
import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'white' }) => {
  const sizeClass = `spinner-${size}`;
  
  return (
    <div className={`spinner-border ${sizeClass}`} style={{ color }} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
};

export default Spinner;
