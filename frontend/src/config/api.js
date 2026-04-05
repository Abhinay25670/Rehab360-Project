/** Central API / Socket / ML base URLs for local and production (VITE_* env). */
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_BASE_URL = API_URL;
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
export const ML_API_URL = import.meta.env.VITE_ML_API_URL || "http://localhost:8000";
