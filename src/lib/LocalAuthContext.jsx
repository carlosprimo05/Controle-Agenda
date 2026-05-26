import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const LOCAL_SESSION_KEY = 'app_local_session';
const DEFAULT_ADMIN = { username: 'admin', password: 'admin123', role: 'admin' };

const LocalAuthContext = createContext(null);

export function LocalAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const session = localStorage.getItem(LOCAL_SESSION_KEY);
      if (session) setCurrentUser(JSON.parse(session));
    } catch {}
    setLoading(false);
  }, []);

  // Fetch users from DB, fallback to localStorage for offline
  const getUsers = async () => {
    try {
      const dbUsers = await base44.entities.LocalUser.list('username', 500);
      // Ensure default admin exists in DB
      const hasAdmin = dbUsers.find(u => u.username === DEFAULT_ADMIN.username);
      if (!hasAdmin) {
        await base44.entities.LocalUser.create(DEFAULT_ADMIN);
        return [DEFAULT_ADMIN, ...dbUsers];
      }
      return dbUsers;
    } catch {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('app_local_users');
        const users = stored ? JSON.parse(stored) : [];
        if (!users.find(u => u.username === DEFAULT_ADMIN.username)) users.unshift(DEFAULT_ADMIN);
        return users;
      } catch { return [DEFAULT_ADMIN]; }
    }
  };

  // Sync local users to DB (used for backup restore)
  const syncUsersToDb = async (users) => {
    const existing = await base44.entities.LocalUser.list('username', 500);
    for (const user of users) {
      const found = existing.find(e => e.username === user.username);
      if (found) {
        await base44.entities.LocalUser.update(found.id, { password: user.password, role: user.role });
      } else {
        await base44.entities.LocalUser.create({ username: user.username, password: user.password, role: user.role });
      }
    }
  };

  // For Settings UI (synchronous from DB via React Query - pass allUsers)
  const getUsersSync = () => {
    try {
      const stored = localStorage.getItem('app_local_users');
      const users = stored ? JSON.parse(stored) : [];
      if (!users.find(u => u.username === DEFAULT_ADMIN.username)) users.unshift(DEFAULT_ADMIN);
      return users;
    } catch { return [DEFAULT_ADMIN]; }
  };

  const login = async (username, password) => {
    const users = await getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) throw new Error('Usuário ou senha incorretos');
    const session = { username: user.username, role: user.role };
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    // Also cache in localStorage for offline
    localStorage.setItem('app_local_users', JSON.stringify(users));
    setCurrentUser(session);
    return session;
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setCurrentUser(null);
  };

  const createUser = async (username, password, role = 'user') => {
    const users = await getUsers();
    if (users.find(u => u.username === username)) throw new Error('Usuário já existe');
    await base44.entities.LocalUser.create({ username, password, role });
    const updated = [...users, { username, password, role }];
    localStorage.setItem('app_local_users', JSON.stringify(updated));
    return updated;
  };

  const deleteUser = async (username) => {
    if (username === 'admin') throw new Error('Não é possível excluir o admin padrão');
    const users = await getUsers();
    const found = users.find(u => u.username === username);
    if (found?.id) await base44.entities.LocalUser.delete(found.id);
    const updated = users.filter(u => u.username !== username);
    localStorage.setItem('app_local_users', JSON.stringify(updated));
    return updated;
  };

  const updateUserPassword = async (username, newPassword, newRole) => {
    const users = await getUsers();
    const found = users.find(u => u.username === username);
    if (found?.id) await base44.entities.LocalUser.update(found.id, { password: newPassword, ...(newRole ? { role: newRole } : {}) });
    const updated = users.map(u => u.username === username ? { ...u, password: newPassword, ...(newRole ? { role: newRole } : {}) } : u);
    localStorage.setItem('app_local_users', JSON.stringify(updated));
    return updated;
  };

  return (
    <LocalAuthContext.Provider value={{
      currentUser,
      loading,
      login,
      logout,
      getUsers,
      getUsersSync,
      createUser,
      deleteUser,
      updateUserPassword,
      syncUsersToDb,
    }}>
      {children}
    </LocalAuthContext.Provider>
  );
}

export function useLocalAuth() {
  const ctx = useContext(LocalAuthContext);
  if (!ctx) throw new Error('useLocalAuth must be used inside LocalAuthProvider');
  return ctx;
}