import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getHospitalProfile(hospitalId?: string | null) {
  if (!hasSupabaseEnv() || !hospitalId) {
    return {
      id: hospitalId ?? "00000000-0000-4000-8000-000000000001",
      name: "Medimade General Hospital",
      legal_name: "Medimade Health Systems, Inc.",
      phone: "+1 212 555 0100",
      email: "operations@medimade.local",
      address: "120 Healthway Ave",
      city: "New York",
      state: "NY",
      postal_code: "10013",
      country: "United States",
      license_number: "NY-HMS-48291"
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("hospitals")
    .select("*")
    .eq("id", hospitalId)
    .single();

  if (error) throw error;
  return data;
}
