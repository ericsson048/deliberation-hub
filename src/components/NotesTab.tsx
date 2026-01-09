import { useMemo, useState, useCallback } from "react";
import { useEtudiants } from "@/hooks/useEtudiants";
import { useUnitesEnseignement } from "@/hooks/useUE";
import { useAllNotes, useUpsertNote } from "@/hooks/useNotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DecisionBadge } from "@/components/DecisionBadge";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { calculerMoyenneUE, calculerMoyenneSemestre, decisionFinale } from "@/lib/calcul";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotesTabProps {
  sessionId: string;
}

export function NotesTab({ sessionId }: NotesTabProps) {
  const { data: etudiants, isLoading: etudiantsLoading } = useEtudiants(sessionId);
  const { data: ues, isLoading: uesLoading } = useUnitesEnseignement(sessionId);
  const etudiantIds = useMemo(() => etudiants?.map(e => e.id) || [], [etudiants]);
  const { data: notes, isLoading: notesLoading } = useAllNotes(sessionId, etudiantIds);
  const upsertNote = useUpsertNote();

  const [selectedEtudiant, setSelectedEtudiant] = useState<string | null>(null);

  // Get all ECUE across all UE
  const allECUE = useMemo(() => {
    if (!ues) return [];
    return ues.flatMap(ue => 
      (ue.ecue || []).map(ecue => ({
        ...ecue,
        ueId: ue.id,
        ueCode: ue.code,
        ueNom: ue.nom,
      }))
    );
  }, [ues]);

  // Get note value for a student and ECUE
  const getNote = useCallback((etudiantId: string, ecueId: string) => {
    return notes?.find(n => n.etudiant_id === etudiantId && n.ecue_id === ecueId)?.note ?? null;
  }, [notes]);

  // Calculate results for a student
  const getResultats = useCallback((etudiantId: string) => {
    if (!ues) return { moyenne: null, creditsValides: 0, creditsTotaux: 0, decision: null };

    const resultatsUE = ues.map(ue => {
      const notesUE = (ue.ecue || []).map(ecue => ({
        note: getNote(etudiantId, ecue.id),
        credits: ecue.credits,
      }));
      return calculerMoyenneUE(notesUE);
    });

    const resultatSemestre = calculerMoyenneSemestre(resultatsUE);
    const decision = decisionFinale(
      resultatSemestre.moyenne,
      resultatSemestre.creditsValides,
      resultatSemestre.creditsTotaux
    );

    return {
      ...resultatSemestre,
      ...decision,
    };
  }, [ues, getNote]);

  // Handle note change with debounce
  const handleNoteChange = async (etudiantId: string, ecueId: string, value: string) => {
    const noteValue = value === "" ? null : parseFloat(value);
    
    if (noteValue !== null && (noteValue < 0 || noteValue > 20)) {
      toast.error("La note doit être entre 0 et 20");
      return;
    }

    try {
      await upsertNote.mutateAsync({
        etudiantId,
        ecueId,
        note: noteValue,
      });
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const isLoading = etudiantsLoading || uesLoading || notesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!etudiants?.length || !ues?.length) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {!etudiants?.length 
                ? "Ajoutez d'abord des étudiants dans l'onglet correspondant."
                : "Ajoutez d'abord des UE et ECUE dans l'onglet Matières."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Grille de saisie des notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium sticky left-0 bg-background z-10 min-w-[200px]">
                    Étudiant
                  </th>
                  {ues?.map(ue => (
                    <th 
                      key={ue.id} 
                      colSpan={(ue.ecue?.length || 0) + 2}
                      className="text-center p-2 font-medium border-l bg-muted/50"
                    >
                      {ue.code}
                    </th>
                  ))}
                  <th colSpan={3} className="text-center p-2 font-medium border-l bg-primary/10">
                    Synthèse
                  </th>
                </tr>
                <tr className="border-b">
                  <th className="text-left p-2 text-muted-foreground sticky left-0 bg-background z-10">
                    Matricule / Nom
                  </th>
                  {ues?.map(ue => (
                    <>
                      {ue.ecue?.map(ecue => (
                        <th key={ecue.id} className="text-center p-2 text-xs text-muted-foreground border-l min-w-[60px]">
                          <div className="truncate max-w-[80px]" title={ecue.nom}>
                            {ecue.code}
                          </div>
                          <div className="text-[10px]">{ecue.credits}cr</div>
                        </th>
                      ))}
                      <th className="text-center p-2 text-xs text-muted-foreground border-l bg-muted/30">
                        Moy
                      </th>
                      <th className="text-center p-2 text-xs text-muted-foreground bg-muted/30">
                        Déc
                      </th>
                    </>
                  ))}
                  <th className="text-center p-2 text-xs text-muted-foreground border-l bg-primary/5">
                    Moyenne
                  </th>
                  <th className="text-center p-2 text-xs text-muted-foreground bg-primary/5">
                    Crédits
                  </th>
                  <th className="text-center p-2 text-xs text-muted-foreground bg-primary/5">
                    Décision
                  </th>
                </tr>
              </thead>
              <tbody>
                {etudiants?.map((etudiant, idx) => {
                  const resultats = getResultats(etudiant.id);
                  
                  return (
                    <tr 
                      key={etudiant.id} 
                      className={cn(
                        "border-b hover:bg-muted/30 transition-colors",
                        selectedEtudiant === etudiant.id && "bg-muted/50"
                      )}
                      onClick={() => setSelectedEtudiant(etudiant.id)}
                    >
                      <td className="p-2 sticky left-0 bg-background z-10">
                        <div className="font-medium">{etudiant.matricule}</div>
                        <div className="text-xs text-muted-foreground">
                          {etudiant.nom} {etudiant.prenom}
                        </div>
                      </td>
                      {ues?.map(ue => {
                        const notesUE = (ue.ecue || []).map(ecue => ({
                          note: getNote(etudiant.id, ecue.id),
                          credits: ecue.credits,
                        }));
                        const resultatUE = calculerMoyenneUE(notesUE);

                        return (
                          <>
                            {ue.ecue?.map(ecue => (
                              <td key={ecue.id} className="p-1 border-l text-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.25"
                                  className="w-14 h-8 text-center text-sm p-1"
                                  defaultValue={getNote(etudiant.id, ecue.id) ?? ""}
                                  onBlur={(e) => handleNoteChange(etudiant.id, ecue.id, e.target.value)}
                                />
                              </td>
                            ))}
                            <td className="p-2 border-l text-center bg-muted/30 font-medium">
                              {resultatUE.moyenne?.toFixed(2) || "-"}
                            </td>
                            <td className="p-2 text-center bg-muted/30">
                              <DecisionBadge decision={resultatUE.decision} size="sm" />
                            </td>
                          </>
                        );
                      })}
                      <td className="p-2 border-l text-center bg-primary/5 font-bold">
                        {resultats.moyenne?.toFixed(2) || "-"}
                      </td>
                      <td className="p-2 text-center bg-primary/5">
                        <span className="text-xs">
                          {resultats.creditsValides}/{resultats.creditsTotaux}
                        </span>
                      </td>
                      <td className="p-2 text-center bg-primary/5">
                        <DecisionBadge decision={resultats.decision} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Légende */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DecisionBadge decision="UV" size="sm" />
              <span className="text-muted-foreground">Unité Validée</span>
            </div>
            <div className="flex items-center gap-2">
              <DecisionBadge decision="UNV" size="sm" />
              <span className="text-muted-foreground">Unité Non Validée</span>
            </div>
            <div className="flex items-center gap-2">
              <DecisionBadge decision="D" size="sm" />
              <span className="text-muted-foreground">Distinction (≥16)</span>
            </div>
            <div className="flex items-center gap-2">
              <DecisionBadge decision="S" size="sm" />
              <span className="text-muted-foreground">Satisfaction (≥14)</span>
            </div>
            <div className="flex items-center gap-2">
              <DecisionBadge decision="R" size="sm" />
              <span className="text-muted-foreground">Réussi (≥10)</span>
            </div>
            <div className="flex items-center gap-2">
              <DecisionBadge decision="AUE" size="sm" />
              <span className="text-muted-foreground">Admis avec UE à rattraper</span>
            </div>
            <div className="flex items-center gap-2">
              <DecisionBadge decision="A" size="sm" />
              <span className="text-muted-foreground">Ajourné</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
