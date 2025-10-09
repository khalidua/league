import React from 'react';
import './PlayerCard.css';
import crisPhoto from '../assets/cris.png';

const PlayerCard: React.FC = () => {
  return (
    <div className="cards-container">
        <div className="card">
          <div className="wrapper">
            <img src={crisPhoto} className="cover-image" alt="Player" />
          </div>
        <div className="character-wrapper">
          <img src={crisPhoto} className="character-img" alt="Player" />
          <h5 className="character-name">Cristiano Ronaldo</h5>
        </div>

        </div>
    </div>
  );
};

export default PlayerCard;
