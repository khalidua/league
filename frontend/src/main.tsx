import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Home from './pages/Home.tsx'
import Players from './pages/Players.tsx'
import Standings from './pages/Standings.tsx'
import Teams from './pages/Teams.tsx'
import TeamDetail from './pages/TeamDetail.tsx'
import PlayerDetail from './pages/PlayerDetail.tsx'
import Matches from './pages/Matches.tsx'
import Rules from './pages/Rules.tsx'
import Profile from './pages/Profile.tsx'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import TeamManagement from './pages/TeamManagement.tsx'
import AdminDashboard from './pages/AdminDashboard.tsx'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <App />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:id" element={<PlayerDetail />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:id" element={<TeamDetail />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/rules" element={<Rules />} />
          
          {/* Protected routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          {/* Authentication routes */}
          <Route 
            path="/login" 
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <ProtectedRoute requireAuth={false}>
                <Register />
              </ProtectedRoute>
            } 
          />
          {/* Onboarding removed: registration now includes optional player fields */}
          <Route 
            path="/team-management" 
            element={
              <ProtectedRoute requireAuth={true} allowedRoles={['Player']}>
                <TeamManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin-only routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAuth={true} allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
