import { apiService } from './api';
import { mockApiService } from './mockApi';

// Determine if we should use local mock API or production REST API
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const securityService = USE_MOCK ? mockApiService : apiService;
export const IS_MOCK_MODE = USE_MOCK;
export { apiService, mockApiService };
