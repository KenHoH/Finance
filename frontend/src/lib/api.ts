import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

let csrfToken = "";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

function readCsrfFromCookie(): string{
  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if(config.method && config.method.toLowerCase() !== "get"){
      const fromCookie = readCsrfFromCookie();
      if(fromCookie && fromCookie !== csrfToken){
        csrfToken = fromCookie;
      } else if(!fromCookie && csrfToken){
        // Cookie expired or was cleared; stale memory value must be discarded
        csrfToken = "";
      }
      if(!csrfToken && config.url !== "/auth/csrf"){
        try{
          await fetchCsrfToken();
        } catch{
          // silent fail
        }
      }
      if(csrfToken){
        config.headers.set("X-CSRF-Token", csrfToken);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async(error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig = error.config as InternalAxiosRequestConfig & { _csrfRetry?: boolean; _logoutFired?: boolean };

    if((status === 401 || status === 403) && !originalConfig._csrfRetry){
      csrfToken = "";
      const fromCookie = readCsrfFromCookie();
      if(fromCookie) csrfToken = fromCookie;

      if(!csrfToken && originalConfig.url !== "/auth/csrf"){
        try{
          await fetchCsrfToken();
          const afterFetch = readCsrfFromCookie();
          if(afterFetch) csrfToken = afterFetch;
        } catch{
          // silent fail
        }
      }

      if(csrfToken && originalConfig.headers){
        originalConfig._csrfRetry = true;
        originalConfig.headers.set("X-CSRF-Token", csrfToken);
        return api(originalConfig);
      }
    }

    if(status === 401 || status === 403){
      csrfToken = "";
      if(status === 401 && originalConfig.url !== "/auth/csrf" && originalConfig.url !== "/email" && !originalConfig._logoutFired){
        if(typeof window !== "undefined"){
          originalConfig._logoutFired = true;
          import("@/store/useAuthStore").then(({ useAuthStore }) => {
            useAuthStore.getState().logout();
          });
        }
      }
    }

    return Promise.reject(error);
  }
);

export async function fetchCsrfToken(){
  try{
    const { data } = await api.get<{ csrfToken: string }>("/auth/csrf");
    if(data?.csrfToken){
      csrfToken = data.csrfToken;
    }
  } catch{
    // silent fail — protected routes will redirect if truly unauthorized
  }
}

export function setCsrfToken(token: string){
  csrfToken = token;
}

export function extractApiError(err: unknown, fallback = "Failed to complete the request. Please try again."): string{
  const axiosErr = err as AxiosError<{ message?: string }>;
  return axiosErr.response?.data?.message || fallback;
}

export function get<T>(url: string, config?: Parameters<typeof api.get>[1]) {
  return api.get<T>(url, config).then((r) => r.data);
}

export function post<T>(url: string, data?: unknown, config?: Parameters<typeof api.post>[2]) {
  return api.post<T>(url, data, config).then((r) => r.data);
}

export function put<T>(url: string, data?: unknown, config?: Parameters<typeof api.put>[2]) {
  return api.put<T>(url, data, config).then((r) => r.data);
}

export function del<T>(url: string, config?: Parameters<typeof api.delete>[1]) {
  return api.delete<T>(url, config).then((r) => r.data);
}

export function patch<T>(url: string, data?: unknown, config?: Parameters<typeof api.patch>[2]) {
  return api.patch<T>(url, data, config).then((r) => r.data);
}
