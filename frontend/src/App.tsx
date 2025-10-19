import Navbar from './components/Navbar'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'


function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // If app boots on an unknown route that was flattened to '/', but URL has a token,
  // redirect to the verify-email page so the token is processed.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const atRoot = location.pathname === '/' || location.pathname === '';
    if (token && atRoot) {
      navigate(`/verify-email?token=${encodeURIComponent(token)}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <>
      <Navbar/>
    </>
  )
}

export default App
