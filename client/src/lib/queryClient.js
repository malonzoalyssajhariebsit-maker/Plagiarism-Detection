import { QueryClient } from "@tanstack/react-query";
async function apiRequest(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Request failed"
    }));
    throw new Error(error.message || "Request failed");
  }
  return response.json();
}
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({
        queryKey
      }) => {
        const url = queryKey[0];
        return apiRequest(url);
      },
      staleTime: 1000 * 60 * 5,
      retry: false
    }
  }
});
export { apiRequest };