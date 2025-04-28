import axios, { AxiosResponse } from 'axios';
import { 
  User, 
  Product, 
  SkinAnalysisResult, 
  AuthCredentials, 
  AuthResponse, 
  ConsultationData, 
  TestResult,
  ApiResponse
} from '../types/index';
import { useToast } from '@chakra-ui/react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const AI_MODEL_URL = import.meta.env.VITE_AI_MODEL_URL || 'http://localhost:5000/predict';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate axios instance for the AI model
const aiModelApi = axios.create({
  baseURL: AI_MODEL_URL,
  headers: {
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// Add request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<AuthResponse>(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: AuthCredentials): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/token/', credentials),
  
  register: (userData: Partial<User>): Promise<AxiosResponse<User>> =>
    api.post('/users/', userData),
  
  refreshToken: (refresh: string): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/token/refresh/', { refresh }),
};

// Image API
export const imageAPI = {
  uploadImage: (imageFile: File): Promise<AxiosResponse<{ id: number; image_url: string }>> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/analysis/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  analyzeImage: (imageId: number): Promise<AxiosResponse<SkinAnalysisResult>> => 
    api.post(`/analysis/${imageId}/analyze/`),
    
  analyzeWithAIModel: async (imageFile: File): Promise<SkinAnalysisResult & { image_id?: number; image_url?: string }> => {
    console.log('Analyzing image with cloud AI model:', {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type
    });

    // Check if user is logged in
    const token = localStorage.getItem('token');
    let imageId: number | null = null;
    let imageUrl: string | null = null;

    // Only try to upload to backend if user is logged in
    if (token) {
      try {
        // First upload the image to the backend
        const uploadResponse = await imageAPI.uploadImage(imageFile);
        imageId = uploadResponse.data.id;
        imageUrl = uploadResponse.data.image_url;
        console.log('Image uploaded to backend:', imageId);
      } catch (error) {
        console.error('Error uploading image to backend:', error);
        // Continue with AI analysis even if backend upload fails
      }
    }

    // Then analyze with the cloud AI model
    const formData = new FormData();
    formData.append('file', imageFile);
    
    // Add retry logic for AI model analysis
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const response = await axios.post<SkinAnalysisResult>(
          AI_MODEL_URL,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // 60 seconds timeout
          }
        );

        // Only try to store analysis result if user is logged in and image was uploaded
        if (token && imageId) {
          try {
            // Store the analysis result in the backend
            const analysisResult = {
              image_id: imageId,
              condition: response.data.condition,
              confidence: response.data.confidence,
              recommendation_type: response.data.recommendation_type,
              message: response.data.message,
            };
            
            await api.post('/analysis-results/', analysisResult);
            console.log('Analysis result stored in backend');
          } catch (error) {
            console.error('Error storing analysis result in backend:', error);
            // Continue even if storing result fails
          }
        }

        console.log('Cloud AI model response:', response.data);
        return {
          ...response.data,
          image_id: imageId || undefined,
          image_url: imageUrl || undefined
        };
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          console.error('Error analyzing image with cloud AI model after retries:', error);
          throw new Error('Failed to analyze image after multiple attempts. Please try again later.');
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
    
    // This should never be reached due to the while loop, but TypeScript needs it
    throw new Error('Failed to analyze image after multiple attempts. Please try again later.');
  },
};

// Product API
export const productAPI = {
  getAllProducts: (): Promise<AxiosResponse<Product[]>> => 
    api.get('/products/'),
  
  getProductById: (productId: number): Promise<AxiosResponse<Product>> => 
    api.get(`/products/${productId}/`),
    
  addProduct: (productData: Partial<Product>): Promise<AxiosResponse<Product>> => 
    api.post('/products/', productData),
    
  updateProduct: (productId: number, data: Partial<Product>): Promise<AxiosResponse<Product>> => {
    // Create a copy of the data to avoid modifying the original
    const updateData = { ...data };
    
    // Remove image if it's not a File object
    if (updateData.image && typeof updateData.image === 'string') {
      delete updateData.image;
    }
    
    return api.patch(`/products/${productId}/`, updateData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
    
  updateProductImage: (productId: number, imageFile: File): Promise<AxiosResponse<Product>> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post(`/products/${productId}/update_image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteProduct: (productId: number): Promise<AxiosResponse<void>> => 
    api.delete(`/products/${productId}/`),
};

// Consultation API
export const consultationAPI = {
  createConsultation: (consultationData: ConsultationData): Promise<AxiosResponse<any>> => 
    api.post('/consultations/create/', consultationData),
  
  getUserConsultations: (): Promise<AxiosResponse<any[]>> => 
    api.get('/consultations/user/'),
};

// Test function to verify AI model endpoint
export const testAIModel = async (): Promise<TestResult> => {
  try {
    // Create a simple test image (1x1 pixel)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1, 1);
    }
    
    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg');
    });
    
    // Create file from blob
    const testFile = new File([blob], 'test.jpg', { type: 'image/jpeg' });
    
    // Create form data
    const formData = new FormData();
    formData.append('file', testFile);
    
    // Send test request
    const response = await aiModelApi.post<TestResult>('', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('AI Model Test Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('AI Model Test Error:', error);
    throw error;
  }
};

const handleError = (error: unknown) => {
  console.error('Error:', error);
  let errorMessage = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message);
  }
  
  useToast({
    title: "Error",
    description: errorMessage,
    status: "error",
    duration: 5000,
    isClosable: true,
  });

  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response;
    if (response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/admin/login';
    }
  }
};

export default api; 