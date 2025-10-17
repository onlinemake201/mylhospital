import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/types';

const STORAGE_KEY = '@hospital_auth';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        console.log('AuthContext: Loading stored user data...');
        
        if (stored) {
          try {
            if (stored === 'undefined' || stored === 'null' || stored.trim() === '') {
              console.warn('AuthContext: Invalid stored value, clearing...');
              await AsyncStorage.removeItem(STORAGE_KEY);
              setUser(null);
              return;
            }
            
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object' && parsed.id) {
              console.log('AuthContext: User loaded successfully:', parsed.email);
              setUser(parsed);
            } else {
              console.warn('AuthContext: Invalid user data structure, clearing...');
              await AsyncStorage.removeItem(STORAGE_KEY);
              setUser(null);
            }
          } catch (parseError) {
            console.error('AuthContext: JSON parse error:', parseError);
            console.log('AuthContext: Stored value was:', stored);
            await AsyncStorage.removeItem(STORAGE_KEY);
            setUser(null);
          }
        } else {
          console.log('AuthContext: No stored user data found');
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: Failed to load user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const demoUsers: Record<string, User> = {
        'admin@hospital.com': {
          id: '1',
          name: 'Admin User',
          email: 'admin@hospital.com',
          role: 'superadmin',
          hospitalId: 'hosp-001',
          avatar: 'https://i.pravatar.cc/150?img=1',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        },
        'doctor@hospital.com': {
          id: '2',
          name: 'Dr. Sarah Johnson',
          email: 'doctor@hospital.com',
          role: 'doctor',
          hospitalId: 'hosp-001',
          departmentId: 'dept-cardiology',
          avatar: 'https://i.pravatar.cc/150?img=2',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        },
        'nurse@hospital.com': {
          id: '3',
          name: 'Maria Schmidt',
          email: 'nurse@hospital.com',
          role: 'nurse',
          hospitalId: 'hosp-001',
          departmentId: 'dept-cardiology',
          avatar: 'https://i.pravatar.cc/150?img=3',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        },
      };

      const user = demoUsers[email];
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (!user.isActive) {
        return { success: false, error: 'Account is disabled' };
      }

      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('AuthContext: Logging out user...');
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
      console.log('AuthContext: User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Logout failed:', error);
      return { success: false, error: 'Logout failed' };
    }
  }, []);

  const switchRole = useCallback(async (role: UserRole) => {
    if (!user) return;
    
    const updatedUser = { ...user, role };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  const hasPermission = useCallback((requiredRole: UserRole | UserRole[]) => {
    if (!user) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }, [user]);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    switchRole,
    hasPermission,
    updateProfile,
  }), [user, isLoading, login, logout, switchRole, hasPermission, updateProfile]);
});
