import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UniteEnseignement, ECUE, UEAvecECUE } from "@/types/deliberation";

export function useUnitesEnseignement(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["unites_enseignement", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("unites_enseignement")
        .select(`
          *,
          ecue (*)
        `)
        .eq("session_id", sessionId)
        .order("ordre", { ascending: true });

      if (error) throw error;
      
      // Sort ECUE by ordre
      return (data as UEAvecECUE[]).map(ue => ({
        ...ue,
        ecue: ue.ecue?.sort((a, b) => a.ordre - b.ordre) || []
      }));
    },
    enabled: !!sessionId,
  });
}

export function useCreateUE() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ue: Omit<UniteEnseignement, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("unites_enseignement")
        .insert(ue)
        .select()
        .single();

      if (error) throw error;
      return data as UniteEnseignement;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unites_enseignement", variables.session_id] });
    },
  });
}

export function useDeleteUE() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: string; sessionId: string }) => {
      const { error } = await supabase.from("unites_enseignement").delete().eq("id", id);
      if (error) throw error;
      return { sessionId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["unites_enseignement", data.sessionId] });
    },
  });
}

export function useCreateECUE() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ecue, sessionId }: { ecue: Omit<ECUE, "id" | "created_at">; sessionId: string }) => {
      const { data, error } = await supabase
        .from("ecue")
        .insert(ecue)
        .select()
        .single();

      if (error) throw error;
      return { data: data as ECUE, sessionId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["unites_enseignement", result.sessionId] });
    },
  });
}

export function useDeleteECUE() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: string; sessionId: string }) => {
      const { error } = await supabase.from("ecue").delete().eq("id", id);
      if (error) throw error;
      return { sessionId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["unites_enseignement", data.sessionId] });
    },
  });
}
