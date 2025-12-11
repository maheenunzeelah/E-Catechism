import axios from 'axios';
import { type } from 'os';
import {profileLoading} from '../actions'

const formData = new FormData();

// ============================================
// NODE API TEMPORARILY DISABLED
// ============================================
// Commenting out Node.js API for Flask-only mode
// All functionalities will work with mock data

/*
export default axios.create({
    baseURL:'http://localhost:3001',
    headers:{
        authorization:localStorage.getItem('jwtToken'),
  
    }
})
*/

// Mock API for Flask-only mode
export default {
    post: async (url, data) => {
        console.log('[MOCK API] POST:', url, data);
        return Promise.resolve({ data: 'Mock response' });
    },
    get: async (url) => {
        console.log('[MOCK API] GET:', url);
        return Promise.resolve({ data: [] });
    },
    put: async (url, data) => {
        console.log('[MOCK API] PUT:', url, data);
        return Promise.resolve({ data: 'Mock response' });
    },
    delete: async (url) => {
        console.log('[MOCK API] DELETE:', url);
        return Promise.resolve({ data: 'Mock response' });
    }
};
//