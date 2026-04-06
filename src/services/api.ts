import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    if (!config.headers) {
      config.headers = {} as any;
    }
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.token) {
          console.log("Setting Authorization header for request to:", config.url);
          if (typeof config.headers.set === "function") {
            config.headers.set("Authorization", `Bearer ${user.token}`);
          } else {
            config.headers["Authorization"] = `Bearer ${user.token}`;
          }
        } else {
          console.warn("No token found in user data from localStorage");
        }
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    } else {
      console.warn("No user found in localStorage for request to:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors (token expired) and "Starting Server" page
api.interceptors.response.use(
  (response) => {
    // Detect AI Studio "Starting Server" page which is returned as HTML (200 OK)
    if (
      typeof response.data === "string" &&
      response.data.includes("Please wait while your application starts...")
    ) {
      console.warn("API: Detected 'Starting Server' page in successful response. Retrying...");
      const error = new Error("Server is starting up");
      (error as any).isStarting = true;
      (error as any).config = response.config;
      return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    const config = error.config;

    // Handle 401 errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("user");
    }

    // Detect AI Studio "Starting Server" page in error response (e.g., 502, 503)
    const isStartingHtml = 
      error.response && 
      typeof error.response.data === "string" && 
      error.response.data.includes("Please wait while your application starts...");
    
    const isGatewayError = error.response && (error.response.status === 502 || error.response.status === 503);
    
    // Also treat network errors (no response) as potential startup state
    const isNetworkError = !error.response;

    if (config && (isStartingHtml || isGatewayError || isNetworkError || error.isStarting)) {
      // Initialize retry count if it doesn't exist
      config.__retryCount = config.__retryCount || 0;

      // Check if we should retry (max 10 times for startup)
      if (config.__retryCount < 10) {
        config.__retryCount += 1;
        // Exponential backoff with jitter
        const baseDelay = Math.min(1000 * Math.pow(2, config.__retryCount), 15000);
        const delay = baseDelay + Math.random() * 1000;
        
        console.warn(`API: Server is starting up. Retrying (${config.__retryCount}/10) in ${Math.round(delay)}ms for ${config.url}...`);
        
        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the request using the same axios instance
        return api(config);
      }
      
      console.error("API: Max retries reached for server startup. Giving up.");
      let serverMessage = "The server is starting up. Please wait a moment and try again.";
      
      if (error.response?.data?.message) {
        serverMessage = error.response.data.message;
      } else if (isGatewayError) {
        serverMessage = "Server is temporarily unavailable (Gateway Error). Please try again in a moment.";
      } else if (isNetworkError) {
        serverMessage = "Network error. Please check your connection or wait for the server to start.";
      } else if (isStartingHtml) {
        serverMessage = "The application is taking longer than expected to start. Please try refreshing the page.";
      }
      
      const startupError = new Error(serverMessage);
      (startupError as any).isStarting = true;
      (startupError as any).response = error.response;
      return Promise.reject(startupError);
    }

    return Promise.reject(error);
  }
);

export default api;
