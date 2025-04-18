export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  role?: string;
  locationPermission?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
} 