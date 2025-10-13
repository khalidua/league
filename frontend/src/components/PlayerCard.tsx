import React from 'react';
import './PlayerCard.css';
import defaultPlayerPhoto from '../assets/defaultPlayer.png';
import { formatFullName } from '../utils/nameUtils';

type PlayerCardProps = {
  player?: {
    playerid: number;
    firstname?: string;
    lastname?: string;
    position?: string;
    jerseynumber?: number;
    profileimage?: string;
  };
  isCaptain?: boolean;
};

const PlayerCard: React.FC<PlayerCardProps> = ({ player, isCaptain = false }) => {
  // Provide default player data if none is provided
  const defaultPlayer = {
    playerid: 0,
    firstname: "Demo",
    lastname: "Player",
    position: "MID",
    jerseynumber: 10,
    profileimage: undefined
  };
  
  const playerData = player || defaultPlayer;
  // Create full name from firstname and lastname, fallback to Player ID
  const fullName = (() => {
    const formattedName = formatFullName(playerData.firstname, playerData.lastname);
    if (formattedName) {
      return formattedName;
    } else {
      return `Player ${playerData.playerid}`;
    }
  })();

  const playerImage = playerData.profileimage || defaultPlayerPhoto;

  return (
    <div className="player-card-container">
      <div className="card">
        <div className="wrapper">
          <img src={playerImage} className="cover-image" alt={`${fullName} background`} />
          {isCaptain && (
            <div className="captain-tag">
              <span>©</span>
            </div>
          )}
        </div>
        <div className="character-wrapper">
          <img src={playerImage} className="character-img" alt={fullName} />
          <h5 className={`character-name ${isCaptain ? 'captain-name' : ''}`}>{fullName}</h5>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
