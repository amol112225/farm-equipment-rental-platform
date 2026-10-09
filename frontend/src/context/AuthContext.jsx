import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginFarmer, registerFarmer, getCurrentFarmer } from '../services/authService';

const TOKEN_KEY = 'agrorent_token';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentFarmer, setCurrentFarmer] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session on initial mount if valid token exists in localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getCurrentFarmer(storedToken);
        if (response && response.data) {
          setToken(storedToken);
          setCurrentFarmer(response.data);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setCurrentFarmer(null);
        }
      } catch (error) {
        // Token invalid, expired, or network failure -> clear local state
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setCurrentFarmer(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Log in with email and password credentials.
   */
  const login = async (email, password) => {
    const response = await loginFarmer({ email, password });
    if (response && response.data && response.data.token) {
      const newJwt = response.data.token;
      const farmerProfile = response.data.farmer;

      localStorage.setItem(TOKEN_KEY, newJwt);
      setToken(newJwt);
      setCurrentFarmer(farmerProfile);

      return farmerProfile;
    }
    throw new Error('Login failed: Token missing in server response.');
  };

  /**
   * Register a new farmer account.
   */
  const register = async (farmerData) => {
    return await registerFarmer(farmerData);
  };

  /**
   * Log out the current farmer session.
   */
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCurrentFarmer(null);
  };

  const value = {
    currentFarmer,
    token,
    isAuthenticated: !!currentFarmer,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
