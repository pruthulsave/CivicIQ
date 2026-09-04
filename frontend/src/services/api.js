import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  if (!file) return resolve(null);
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

export const api = {
  login: async (credentials) => {
    try {
      const res = await axiosInstance.post('/auth/login', credentials);
      return res.data;
    } catch (error) {
      if (!error.response) throw new Error('Server offline');
      throw new Error(error.response.data.message || 'Login failed');
    }
  },
  register: async (userData) => {
    try {
      const res = await axiosInstance.post('/auth/register', userData);
      return res.data;
    } catch (error) {
      if (!error.response) throw new Error('Server offline');
      throw new Error(error.response.data.message || 'Registration failed');
    }
  },
  submitComplaint: async (formData) => {
    try {
      const payload = {};
      for (let [key, value] of formData.entries()) {
        if (key === 'image' && value instanceof File) {
          payload[key] = await fileToBase64(value);
        } else if (['latitude', 'longitude', 'accuracy'].includes(key)) {
          payload[key] = Number(value);
        } else {
          payload[key] = value;
        }
      }
      const res = await axiosInstance.post('/complaints', payload);
      return res.data;
    } catch (error) {
      if (!error.response) throw new Error('Backend offline');
      throw new Error(error.response.data.message || 'Validation error');
    }
  },
  precheckComplaint: async (formData) => {
    try {
      const payload = {};
      for (let [key, value] of formData.entries()) {
        if (key === 'image' && value instanceof File) {
          payload[key] = await fileToBase64(value);
        } else if (['latitude', 'longitude', 'accuracy'].includes(key)) {
          payload[key] = Number(value);
        } else {
          payload[key] = value;
        }
      }
      const res = await axiosInstance.post('/complaints/precheck', payload);
      return res.data;
    } catch (error) {
      if (!error.response) throw new Error('Backend offline');
      throw new Error(error.response.data.message || 'Validation error');
    }
  },
  getComplaints: async () => {
    try {
      const res = await axiosInstance.get('/complaints');
      return res.data;
    } catch (error) {
      if (!error.response) throw new Error('Backend offline');
      throw new Error('Failed to fetch complaints');
    }
  },
  detectIssue: async (formData) => {
    try {
      const res = await axiosInstance.post('/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data;
    } catch (error) {
      if (!error.response) throw new Error('Backend offline');
      throw new Error('Detection failed');
    }
  }
};
