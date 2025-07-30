import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'

// 1. Create the Context
export const AuthContext = createContext();

// 2. Create the Provider
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // true initially while checking
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const refreshRes = await fetch('http://localhost:5000/api/auth/refresh', {
          credentials: 'include',
        });
        console.log("res",refreshRes);
        if (refreshRes.ok) {
          setIsAuthenticated(true);
          const verifyRes = await fetch('http://localhost:5000/api/verify', {
            credentials: 'include',
          });
          if (verifyRes.ok) {
            const userData = await verifyRes.json();
            setUser(userData);
          } else {
            console.error('Failed to fetch user data after refresh/verify');
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          // navigate("/login")
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, authLoading ,user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
