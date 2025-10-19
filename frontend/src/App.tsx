import Navbar from './components/Navbar'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'


function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Handle hash-based verification links and redirect to proper route
  useEffect(() => {
    // Check if we have a hash with verify-email route
    if (window.location.hash) {
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      
      // If hash contains verify-email route, navigate to it
      if (hash.startsWith('/verify-email')) {
        navigate(hash, { replace: true });
        return;
      }
      
      // If hash contains just a token, redirect to verify-email
      const hashParams = new URLSearchParams(hash.split('?')[1] || '');
      const token = hashParams.get('token');
      if (token) {
        navigate(`/verify-email?token=${encodeURIComponent(token)}`, { replace: true });
        return;
      }
    }
    
    // Also check query params for token
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const atRoot = location.pathname === '/' || location.pathname === '';
    if (token && atRoot) {
      navigate(`/verify-email?token=${encodeURIComponent(token)}`, { replace: true });
    }
  }, []); // Remove dependencies to prevent infinite loop

  return (
    <>
      <Navbar/>
    </>
  )
}

export default App
