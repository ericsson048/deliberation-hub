import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Note } from "@/types/deliberation";

export function useNotes(etudiantId: string | undefined) {
  return useQuery({
    queryKey: ["notes", etudiantId],
    queryFn: async () => {
      if (!etudiantId) return [];
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("etudiant_id", etudiantId);

      if (error) throw error;
      return data as Note[];
    },
    enabled: !!etudiantId,
  });
}

export function useAllNotes(sessionId: string | undefined, etudiantIds: string[]) {
  return useQuery({
    queryKey: ["notes", "session", sessionId],
    queryFn: async () => {
      if (!sessionId || etudiantIds.length === 0) return [];
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .in("etudiant_id", etudiantIds);

      if (error) throw error;
      return data as Note[];
    },
    enabled: !!sessionId && etudiantIds.length > 0,
  });
}

export function useUpsertNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      etudiantId, 
      ecueId, 
      note 
    }: { 
      etudiantId: string; 
      ecueId: string; 
      note: number | null;
    }) => {
      const { data, error } = await supabase
        .from("notes")
        .upsert(
          { 
            etudiant_id: etudiantId, 
            ecue_id: ecueId, 
            note 
          },
          { onConflict: 'etudiant_id,ecue_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes", data.etudiant_id] });
      queryClient.invalidateQueries({ queryKey: ["notes", "session"] });
    },
  });
}
