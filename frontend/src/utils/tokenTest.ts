// Utility to test token persistence
export const testTokenPersistence = () => {
  console.log('🔍 Testing token persistence...');
  
  // Check if token exists in localStorage
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  console.log('Token in localStorage:', token ? '✅ Found' : '❌ Not found');
  
  // Check if token is valid (not expired)
  if (token) {
    try {
      // Decode JWT token (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < now;
      
      console.log('Token expiration:', isExpired ? '❌ Expired' : '✅ Valid');
      console.log('Token expires at:', new Date(payload.exp * 1000).toLocaleString());
    } catch (error) {
      console.log('❌ Invalid token format');
    }
  }
  
  return !!token;
};

// Call this function in browser console to test
(window as any).testTokenPersistence = testTokenPersistence;
