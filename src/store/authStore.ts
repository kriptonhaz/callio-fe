import { Store } from '@tanstack/store';

export type UserRole = 'superadmin' | 'admin' | 'agent';

export interface User {
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const authStore = new Store<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
});

export const login = async (email: string, role: UserRole) => {
  authStore.setState((state) => ({ ...state, isLoading: true }));
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  authStore.setState((state) => ({
    ...state,
    isLoading: false,
    isAuthenticated: true,
    user: {
      email,
      name: role.charAt(0).toUpperCase() + role.slice(1),
      role,
    },
  }));
};

export const logout = () => {
  authStore.setState((state) => ({
    ...state,
    user: null,
    isAuthenticated: false,
  }));
};
