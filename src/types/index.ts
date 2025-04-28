// User types
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  age: number | null;
  last_skin_condition: string;
  is_active: boolean;
}

// Product types
export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  suitable_for: string;
  targets: string;
  when_to_apply: string;
}

// Skin analysis types
export interface SkinAnalysisResult {
  condition: string;
  confidence: number;
  message?: string;
  products?: Product[];
  recommendation_type?: string;
}

// Form data types
export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  sex: string;
  country: string;
  password: string;
  confirmPassword: string;
  skinType: Record<string, boolean>;
  skinConcerns: Record<string, boolean>;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// Auth types
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

// Consultation types
export interface ConsultationData {
  date: string;
  message: string;
}

// Test result types
export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
} 