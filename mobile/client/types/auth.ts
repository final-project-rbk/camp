export interface User {
  id: number;
  email: string;
  username?: string;
  avatar?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
} 