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

// Initialize from localStorage if available
const token = typeof window !== 'undefined' ? localStorage.getItem('callio_access_token') : null;

export const authStore = new Store<AuthState>({
  user: null, // We don't have user details in local storage, only token
  isAuthenticated: !!token,
  isLoading: false,
});

// Deprecated: Use useLogin hook instead
export const login = async (_email: string, _role: UserRole) => {
  console.warn('Using deprecated login function. Please use useLogin hook.');
};

// Deprecated: Use useLogout hook instead
export const logout = () => {
  authStore.setState((state) => ({
    ...state,
    user: null,
    isAuthenticated: false,
  }));
};
