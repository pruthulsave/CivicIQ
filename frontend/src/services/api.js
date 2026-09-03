const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  if (!file) return resolve(null);
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

export const api = {
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
      console.log("FINAL PAYLOAD", payload);
      console.log(typeof payload.longitude, payload.longitude);

      const response = await fetch(`${API_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Validation error');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Backend offline');
      }
      throw error;
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
      console.log("FINAL PAYLOAD", payload);
      console.log(typeof payload.longitude, payload.longitude);

      const response = await fetch(`${API_URL}/complaints/precheck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Validation error');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Backend offline');
      }
      throw error;
    }
  },
  getComplaints: async () => {
    try {
      const response = await fetch(`${API_URL}/complaints`);
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Backend offline');
      }
      throw error;
    }
  }
};
