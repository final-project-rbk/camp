import axios, { AxiosError } from 'axios';

// Get the API URL from environment variables, fallback to default if not available
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/';

/**
 * Interface for the Hint data model used in the dashboard
 */
export interface Hint {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToComplete: string;
  image: string;
  gallerySteps?: { title: string; description: string; image: string }[];
  views: number;
  category: 'fire' | 'shelter' | 'food' | 'gear';
}

/**
 * Interface for API response structure
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Interface for request parameters when fetching hints
 */
interface GetHintsParams {
  page?: number;
  limit?: number;
  category?: string;
  difficulty?: string;
  search?: string;
  _t?: number; // Add timestamp parameter for cache busting
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Helper function to handle API errors
 */
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{message?: string}>;
    const status = axiosError.response?.status || 500;
    const message = axiosError.response?.data?.message || axiosError.message || 'An error occurred';
    throw new ApiError(`API Error: ${message}`, status);
  }
  throw new ApiError(error instanceof Error ? error.message : 'Unknown error');
};

/**
 * Helper function to get authorization headers
 */
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

/**
 * Transform backend hint data to match dashboard format
 */
const transformHintData = (hint: any): Hint => {
  let gallerySteps = [];
  
  try {
    if (typeof hint.gallerySteps === 'string' && hint.gallerySteps.trim() !== '') {
      gallerySteps = JSON.parse(hint.gallerySteps);
    } else if (Array.isArray(hint.gallerySteps)) {
      gallerySteps = hint.gallerySteps;
    }
  } catch (error) {
    console.error('Error parsing gallery steps:', error);
  }
  
  return {
    id: hint.id,
    title: hint.title,
    description: hint.description,
    difficulty: hint.difficulty || 'beginner',
    timeToComplete: hint.timeToComplete,
    image: hint.image,
    views: hint.views || 0,
    category: hint.category || 'fire',
    gallerySteps
  };
};

/**
 * Get all hints with optional filtering parameters
 */
export const getAllHints = async (params: GetHintsParams = {}): Promise<Hint[]> => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await axios.get<ApiResponse<any[]>>(`${API_URL}hints${queryString}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to fetch hints');
    }
    
    // Transform backend data to match dashboard format
    return (response.data.data || []).map(transformHintData);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get a single hint by ID
 */
export const getHintById = async (id: number): Promise<Hint> => {
  try {
    const response = await axios.get<ApiResponse<any>>(`${API_URL}hints/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to fetch hint');
    }
    
    return transformHintData(response.data.data);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create a new hint
 */
export const createHint = async (hint: Omit<Hint, 'id' | 'views'>): Promise<Hint> => {
  try {
    // Transform gallery steps to JSON string for backend
    const hintData = {
      ...hint,
      gallerySteps: hint.gallerySteps ? JSON.stringify(hint.gallerySteps) : '[]'
    };
    
    const response = await axios.post<ApiResponse<any>>(`${API_URL}hints`, hintData, {
      headers: getAuthHeaders()
    });
    
    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to create hint');
    }
    
    return transformHintData(response.data.data);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update an existing hint
 */
export const updateHint = async (hint: Hint): Promise<Hint> => {
  try {
    // Transform gallery steps to JSON string for backend
    const hintData = {
      ...hint,
      gallerySteps: hint.gallerySteps ? JSON.stringify(hint.gallerySteps) : '[]'
    };
    
    const response = await axios.put<ApiResponse<any>>(`${API_URL}hints/${hint.id}`, hintData, {
      headers: getAuthHeaders()
    });
    
    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to update hint');
    }
    
    return transformHintData(response.data.data);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a hint
 */
export const deleteHint = async (id: number): Promise<void> => {
  try {
    const response = await axios.delete<ApiResponse<any>>(`${API_URL}hints/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to delete hint');
    }
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get analytics data for hints
 */
export const getHintsAnalytics = async () => {
  try {
    const response = await axios.get<ApiResponse<any>>(`${API_URL}hints/analytics`, {
      headers: getAuthHeaders()
    });
    
    if (!response.data.success) {
      throw new ApiError(response.data.message || 'Failed to fetch analytics');
    }
    
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
}; 