const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lj8tjaipcj.execute-api.ap-south-1.amazonaws.com/Prod';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Attempt to parse JSON regardless of status for error messages
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        // Not all responses are JSON
      }

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `API Error: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getForecast() {
    return this.request('/forecast');
  }

  async runSimulation(config) {
    return this.request('/simulation', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  async simulateWhatIf(config) {
    return this.request('/simulate_what_if', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  async getSimulation(id) {
    return this.request(`/simulation/${id}`);
  }

  async getSchedule(id) {
    return this.request(`/schedule/${id}`);
  }
}

export const api = new ApiClient();
