import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/types';

const STORAGE_KEY = '@hospital_users';

export const [UserManagementProvider, useUserManagement] = createContextHook(() => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('UserManagement: Loading stored users data...');
      
      if (stored) {
        try {
          if (stored === 'undefined' || stored === 'null' || stored.trim() === '') {
            console.warn('UserManagement: Invalid stored value, resetting...');
            await AsyncStorage.removeItem(STORAGE_KEY);
          } else {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              console.log('UserManagement: Users loaded successfully:', parsed.length);
              setUsers(parsed);
              setIsLoading(false);
              return;
            } else {
              console.warn('UserManagement: Invalid users data format, resetting to defaults...');
              await AsyncStorage.removeItem(STORAGE_KEY);
            }
          }
        } catch (parseError) {
          console.error('UserManagement: JSON parse error:', parseError);
          console.log('UserManagement: Stored value was:', stored);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
      
      const defaultUsers: User[] = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@hospital.com',
          role: 'superadmin',
          hospitalId: 'hosp-001',
          avatar: 'https://i.pravatar.cc/150?img=1',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Dr. Sarah Johnson',
          email: 'doctor@hospital.com',
          role: 'doctor',
          hospitalId: 'hosp-001',
          departmentId: 'dept-cardiology',
          avatar: 'https://i.pravatar.cc/150?img=2',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Maria Schmidt',
          email: 'nurse@hospital.com',
          role: 'nurse',
          hospitalId: 'hosp-001',
          departmentId: 'dept-cardiology',
          avatar: 'https://i.pravatar.cc/150?img=3',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
      setUsers(defaultUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);



  const saveUsers = async (updatedUsers: User[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Failed to save users:', error);
      throw error;
    }
  };

  const createUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt' | 'isActive'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const updatedUsers = [...users, newUser];
    await saveUsers(updatedUsers);
    return newUser;
  }, [users]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, ...updates } : user
    );
    await saveUsers(updatedUsers);
  }, [users]);

  const deleteUser = useCallback(async (userId: string) => {
    const updatedUsers = users.filter(user => user.id !== userId);
    await saveUsers(updatedUsers);
  }, [users]);

  const toggleUserStatus = useCallback(async (userId: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    );
    await saveUsers(updatedUsers);
  }, [users]);

  const resetPassword = useCallback(async (userId: string, newPassword: string) => {
    console.log(`Password reset for user ${userId}: ${newPassword}`);
    return { success: true, message: 'Passwort erfolgreich zurückgesetzt' };
  }, []);

  const getUsersByRole = useCallback((role: UserRole) => {
    return users.filter(user => user.role === role);
  }, [users]);

  const getActiveUsers = useCallback(() => {
    return users.filter(user => user.isActive);
  }, [users]);

  return useMemo(() => ({
    users,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetPassword,
    getUsersByRole,
    getActiveUsers,
    reloadUsers: loadUsers,
  }), [users, isLoading, createUser, updateUser, deleteUser, toggleUserStatus, resetPassword, getUsersByRole, getActiveUsers, loadUsers]);
});
