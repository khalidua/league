import React, { useState } from 'react';
import './Matches.css';
import realLogo from '../assets/realLogo.png'
import manLogo from '../assets/manLogo.png'

const Matches: React.FC = () => {
   const [query, setQuery] = useState('');
   const [selectedDate, setSelectedDate] = useState<string>('');
   const [myOnly, setMyOnly] = useState(false);
  return (
    <div className="MatchesPage">
       <div className="matches-strap">MATCHES</div>
       <div className="matches-section">
       <div className="matches-controls">
         <input className="search-input" type="text" placeholder="Search team or league..." value={query} onChange={(e)=>setQuery(e.target.value)} />
         <input className="date-input" type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} />
         <button className={`only-mine${myOnly ? ' is-on' : ''}`} onClick={()=>setMyOnly(v=>!v)}>
           Only my matches
         </button>
       </div>
        <div className='match-card'>
            <div className='first-team'>
              <img src={realLogo} alt="Real Madrid"/>
              <h2>Real Madrid</h2>
            </div>
            <div className='match-details-card'>
                <h3>9:00 PM</h3>
            </div>
            <div className='second-team'>
              <img src={manLogo} alt="Manchester United"/>
              <h2>Manchester United</h2>
            </div>
        </div>
                <div className='match-card'>
            <div className='first-team'>
              <img src={realLogo} alt="Real Madrid"/>
              <h2>Real Madrid</h2>
            </div>
            <div className='match-details-card'>
                <h3 className='kickoff-time'>9:00 PM</h3>
            </div>
            <div className='second-team'>
              <img src={manLogo} alt="Manchester United"/>
              <h2>Manchester United</h2>
            </div>
        </div>
       </div>
    </div>
  );
};

export default Matches;


