import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  return {
    user: user ?? null,
    loading: isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    logout: () => logoutMutation.mutate(),
  };
}
