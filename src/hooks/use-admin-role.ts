import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisitorAccess } from "@/components/VisitorAccess";

export function useAdminRole() {
  const { isVisitor } = useVisitorAccess();

  return useQuery({
    queryKey: ["current-user-role", "admin"],
    enabled: !isVisitor,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) return false;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return data?.role === "admin";
    },
  });
}