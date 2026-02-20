import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { api } from "./api";

type UnauthorizedBehavior = "returnNull" | "throw";

export function getQueryFn<T = any>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T | null> {
  return async ({ queryKey }) => {
    try {
      const path = queryKey.join("/");
      return await api<T>(path, { method: "GET" });
    } catch (err: any) {
      if (options.on401 === "returnNull" && err.message?.includes("401")) {
        return null;
      }
      throw err;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
