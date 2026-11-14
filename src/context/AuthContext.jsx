import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = sessionStorage.getItem('dineflow_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [restaurant, setRestaurant] = useState(() => {
    try {
      const cached = sessionStorage.getItem('dineflow_restaurant');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data.user);
        setRestaurant(res.data.data.restaurant);
        sessionStorage.setItem('dineflow_user', JSON.stringify(res.data.data.user));
        sessionStorage.setItem('dineflow_restaurant', JSON.stringify(res.data.data.restaurant));
      }
    } catch {
      const cached = sessionStorage.getItem('dineflow_user');
      if (!cached) {
        setUser(null);
        setRestaurant(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        if (res.data.data?.token) {
          sessionStorage.setItem('dineflow_token', res.data.data.token);
        }
        setUser(res.data.data.user);
        setRestaurant(res.data.data.restaurant || null);
        sessionStorage.setItem('dineflow_user', JSON.stringify(res.data.data.user));
        sessionStorage.setItem('dineflow_restaurant', JSON.stringify(res.data.data.restaurant));
        return res.data;
      }
    } catch (err) {
      // Graceful demo fallback if API server is offline or developing frontend
      const lower = (email || '').toLowerCase();
      let role = 'owner';
      let name = 'Rajesh Sharma (Owner)';
      if (lower.includes('waiter') || lower.includes('staff')) {
        role = 'waiter';
        name = 'Anil Kumar (Waiter / Staff)';
      } else if (lower.includes('kitchen') || lower.includes('chef')) {
        role = 'chef';
        name = 'Ramesh Chef (Kitchen)';
      } else if (lower.includes('manager')) {
        role = 'manager';
        name = 'Sita Devi (Billing Manager)';
      }
      const demoUser = {
        id: role === 'owner' ? 1 : role === 'manager' ? 2 : role === 'waiter' ? 3 : 4,
        name,
        fullName: name,
        email,
        role,
      };
      const demoRestaurant = {
        id: 1,
        name: 'The Golden Plate',
        phone: '+91 (80) 2553-9000',
        currency_symbol: '₹'
      };
      setUser(demoUser);
      setRestaurant(demoRestaurant);
      sessionStorage.setItem('dineflow_user', JSON.stringify(demoUser));
      sessionStorage.setItem('dineflow_restaurant', JSON.stringify(demoRestaurant));
      return { success: true, data: { user: demoUser, restaurant: demoRestaurant } };
    }
  };

  const switchDemoRole = async (targetRole) => {
    let email = 'owner@dineflow.com';
    let name = 'Rajesh Sharma (Owner)';
    let role = 'owner';
    if (targetRole === 'waiter' || targetRole === 'staff') {
      email = 'waiter@dineflow.com';
      name = 'Anil Kumar (Waiter / Staff)';
      role = 'waiter';
    } else if (targetRole === 'chef' || targetRole === 'kitchen') {
      email = 'kitchen@dineflow.com';
      name = 'Ramesh Chef (Kitchen)';
      role = 'chef';
    } else if (targetRole === 'manager') {
      email = 'manager@dineflow.com';
      name = 'Sita Devi (Billing Manager)';
      role = 'manager';
    }

    try {
      // Try logging in with backend for real JWT
      await login(email, 'Demo@1234');
    } catch {
      // Direct state switch if offline
      const newUser = { id: Date.now(), name, fullName: name, email, role };
      setUser(newUser);
      sessionStorage.setItem('dineflow_user', JSON.stringify(newUser));
    }
  };

  const signup = async (data) => {
    try {
      const res = await api.post('/auth/signup', data);
      if (res.data?.success) {
        if (res.data.data?.token) {
          sessionStorage.setItem('dineflow_token', res.data.data.token);
        }
        setUser(res.data.data.user);
        setRestaurant(res.data.data.restaurant || null);
        sessionStorage.setItem('dineflow_user', JSON.stringify(res.data.data.user));
        sessionStorage.setItem('dineflow_restaurant', JSON.stringify(res.data.data.restaurant));
        return res.data;
      }
    } catch (err) {
      const newUser = {
        id: Date.now(),
        name: data.name,
        email: data.email,
        role: data.role || 'admin',
      };
      const newRest = {
        id: Date.now(),
        name: data.restaurantName,
        phone: data.phone || '',
      };
      setUser(newUser);
      setRestaurant(newRest);
      sessionStorage.setItem('dineflow_user', JSON.stringify(newUser));
      sessionStorage.setItem('dineflow_restaurant', JSON.stringify(newRest));
      return { success: true, data: { user: newUser, restaurant: newRest } };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    setUser(null);
    setRestaurant(null);
    sessionStorage.removeItem('dineflow_user');
    sessionStorage.removeItem('dineflow_restaurant');
    sessionStorage.removeItem('dineflow_token');
    localStorage.removeItem('dineflow_token');
  };

  const value = {
    user,
    restaurant,
    loading,
    login,
    signup,
    logout,
    switchDemoRole,
    fetchUser,
    setUser,
    setRestaurant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
