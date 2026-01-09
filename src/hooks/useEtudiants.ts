import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Etudiant } from "@/types/deliberation";

export function useEtudiants(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["etudiants", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("etudiants")
        .select("*")
        .eq("session_id", sessionId)
        .order("nom", { ascending: true });

      if (error) throw error;
      return data as Etudiant[];
    },
    enabled: !!sessionId,
  });
}

export function useEtudiant(id: string | undefined) {
  return useQuery({
    queryKey: ["etudiant", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("etudiants")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Etudiant;
    },
    enabled: !!id,
  });
}

export function useCreateEtudiant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etudiant: Omit<Etudiant, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("etudiants")
        .insert(etudiant)
        .select()
        .single();

      if (error) throw error;
      return data as Etudiant;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["etudiants", variables.session_id] });
    },
  });
}

export function useUpdateEtudiant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...etudiant }: Partial<Etudiant> & { id: string }) => {
      const { data, error } = await supabase
        .from("etudiants")
        .update(etudiant)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Etudiant;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["etudiants", data.session_id] });
      queryClient.invalidateQueries({ queryKey: ["etudiant", data.id] });
    },
  });
}

export function useDeleteEtudiant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: string; sessionId: string }) => {
      const { error } = await supabase.from("etudiants").delete().eq("id", id);
      if (error) throw error;
      return { sessionId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["etudiants", data.sessionId] });
    },
  });
}
