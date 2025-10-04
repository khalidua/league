import React from 'react';
import PlayerCard from '../components/PlayerCard';
import Carousel from '../components/Carousel';
import "./Home.css"
import StandingsTable, { type StandingsTeam } from '../components/StandingsTable';
import crisLogo from '../assets/cris.png';
import realLogo from '../assets/realLogo.png';
import manLogo from '../assets/manLogo.png';
import reactLogo from '../assets/react.svg';

const Home: React.FC = () => {
  const demoTeams: StandingsTeam[] = [
    {
      id: 1,
      name: 'CRIS FC',
      logoUrl: crisLogo,
      played: 10,
      wins: 7,
      draws: 2,
      losses: 1,
      goalsFor: 20,
      goalsAgainst: 9,
      goalDifference: 11,
      points: 23,
      form: 'W-W-D-W-W'
    },
    {
      id: 2,
      name: 'React United',
      logoUrl: reactLogo,
      played: 10,
      wins: 6,
      draws: 3,
      losses: 1,
      goalsFor: 18,
      goalsAgainst: 8,
      goalDifference: 10,
      points: 21,
      form: 'W-D-W-W-D'
    },
    {
      id: 3,
      name: 'Vite City',
      logoUrl: reactLogo,
      played: 10,
      wins: 5,
      draws: 3,
      losses: 2,
      goalsFor: 15,
      goalsAgainst: 10,
      goalDifference: 5,
      points: 18,
      form: 'D-W-L-W-D'
    }
  ];
  return (
    <>
      <div className='Home'>
        <div className='Hero'>
          <div className='match-details'>
            <h1>Upcoming Match</h1>
            <h2><strong>Team A</strong> vs <strong>Team B</strong></h2>
            <p>📅 October 10th — 7:00 PM</p>
            <p>📍 Zewail City Stadium</p>
            <button>View Full Schedule</button>
          </div>
          <div className='logos'>
            <img className='team1' src={realLogo} />
            <img className='team2' src={manLogo} />
          </div>
        </div>
        <div className='team'><h2>MY TEAM</h2></div>
        <div className='players'>
          <Carousel autoplayMs={4000}>
            <PlayerCard />
            <PlayerCard />
            <PlayerCard />
            <PlayerCard />
            <PlayerCard />
            <PlayerCard />
            <PlayerCard />
            <PlayerCard />
          </Carousel>
        </div>
        <div className='standing' style={{ marginTop: '24px' }}>
          <StandingsTable title="League Standings" teams={demoTeams} showForm />
        </div>
      </div>
    </>
  );
};

export default Home;
