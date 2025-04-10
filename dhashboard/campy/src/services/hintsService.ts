import axios from 'axios';

// Define API base URL - this should match your backend setup
// Make sure the URL ends with a slash if needed or adjust path concatenation below
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/';

// Define the Hint interface
export interface Hint {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToComplete: string;
  image: string;
  gallerySteps?: any[];
  category: 'fire' | 'shelter' | 'food' | 'gear';
  views: number;
  createdAt?: string;
  updatedAt?: string;
}

// Get auth token from localStorage (with safety check for SSR)
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userToken');
  }
  return null;
};

// Get all hints with optional query parameters
export const getAllHints = async (params?: any) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}hints`, { 
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching hints:', error);
    throw error;
  }
};

// Get a hint by ID
export const getHintById = async (id: number) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}hints/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching hint:', error);
    throw error;
  }
};

// Create a new hint
export const createHint = async (hint: Omit<Hint, 'id' | 'views'>) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}hints`, hint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating hint:', error);
    throw error;
  }
};

// Update an existing hint
export const updateHint = async (hintData: Hint) => {
  try {
    const token = getAuthToken();
    const { id, ...hint } = hintData;
    const response = await axios.put(`${API_URL}hints/${id}`, hint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error updating hint:', error);
    throw error;
  }
};

// Delete a hint
export const deleteHint = async (id: number) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}hints/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting hint:', error);
    throw error;
  }
};

// Get most viewed hints
export const getMostViewedHints = async (limit: number = 5) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}hints/most-viewed?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching most viewed hints:', error);
    throw error;
  }
};

// Increment hint view count
export const incrementHintView = async (id: number) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}hints/${id}/increment-view`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error incrementing hint view:', error);
    throw error;
  }
};

// Bulk insert hints
export const bulkImportHints = async (hints: Omit<Hint, 'id' | 'views'>[]) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}hints/bulk`, hints, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error bulk importing hints:', error);
    throw error;
  }
}; 