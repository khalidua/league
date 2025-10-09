import React from 'react';
import { Link } from 'react-router-dom';
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
  const groupA: StandingsTeam[] = demoTeams;
  const groupB: StandingsTeam[] = [
    { id: 'b1', name: 'Man Devs', logoUrl: manLogo, played: 10, wins: 6, draws: 2, losses: 2, goalsFor: 17, goalsAgainst: 9, goalDifference: 8, points: 20, form: 'W-W-D-L-W' },
    { id: 'b2', name: 'Real Coders', logoUrl: realLogo, played: 10, wins: 6, draws: 1, losses: 3, goalsFor: 16, goalsAgainst: 12, goalDifference: 4, points: 19, form: 'W-L-W-W-L' },
    { id: 'b3', name: 'Vite City', logoUrl: reactLogo, played: 10, wins: 5, draws: 3, losses: 2, goalsFor: 14, goalsAgainst: 11, goalDifference: 3, points: 18, form: 'D-W-W-L-D' }
  ];

  const groups: { title: string; teams: StandingsTeam[] }[] = [
    { title: 'Group A', teams: groupA },
    { title: 'Group B', teams: groupB }
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
        <div className='standing-grid'>
        {groups.map(g => {
          const top3 = [...g.teams].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
          }).slice(0, 3);
          return (
            <div key={g.title} style={{ marginBottom: '24px' }}>
              <StandingsTable title={g.title} teams={top3} showForm />
            </div>
          );
        })}
        </div>
        <div className='standings-actions'>
          <Link className='standings-cta' to="/standings">See full standings</Link>
        </div>
      </div>
      </div>
    </>
  );
};

export default Home;
