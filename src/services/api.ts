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
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
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

    if (isStartingHtml || isGatewayError || isNetworkError) {
      console.warn(`API: Detected server startup state (${error.response?.status || "Network Error"}). Retrying...`);
      const startupError = new Error("Server is starting up");
      (startupError as any).isStarting = true;
      return Promise.reject(startupError);
    }

    return Promise.reject(error);
  }
);

export default api;
