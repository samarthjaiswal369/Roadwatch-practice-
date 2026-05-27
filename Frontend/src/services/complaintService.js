const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const complaintService = {
  createComplaint: async (complaintData, token) => {
    const response = await fetch(`${API_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(complaintData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create complaint');
    }

    return response.json();
  },

  getComplaints: async (token) => {
    const response = await fetch(`${API_URL}/api/complaints`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch complaints');
    }

    return response.json();
  },

  updateStatus: async (id, status, token) => {
    const response = await fetch(`${API_URL}/api/complaints/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update status');
    }

    return response.json();
  }
};
