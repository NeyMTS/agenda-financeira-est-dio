import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function clientOptions(householdId: string) {
  return queryOptions({
    queryKey: ["studio-clients", householdId],
    queryFn: async () => {
      const { data, error } = await supabase.from("studio_clients")
        .select("id, name, phone, birth_date, created_at").eq("household_id", householdId).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function serviceOptions(householdId: string) {
  return queryOptions({
    queryKey: ["studio-services", householdId],
    queryFn: async () => {
      const { data, error } = await supabase.from("studio_services")
        .select("id, name, default_price, icon, active").eq("household_id", householdId).eq("active", true).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function appointmentOptions(householdId: string, start: string, end: string) {
  return queryOptions({
    queryKey: ["studio-appointments", householdId, start, end],
    queryFn: async () => {
      const { data, error } = await supabase.from("studio_appointments")
        .select("id, client_id, service_id, service_name, total_amount, deposit_amount, received_amount, scheduled_date, scheduled_time, status, studio_clients(name, phone)")
        .eq("household_id", householdId).gte("scheduled_date", start).lte("scheduled_date", end)
        .neq("status", "cancelado").order("scheduled_date").order("scheduled_time");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function offlineMonths(now = new Date()) {
  return [-1, 0, 1].map((offset) => {
    const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return [key(first), key(last)] as const;
  });
}