import { useState } from "react";
import { useUnitesEnseignement, useCreateUE, useDeleteUE, useCreateECUE, useDeleteECUE } from "@/hooks/useUE";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface UETabProps {
  sessionId: string;
}

export function UETab({ sessionId }: UETabProps) {
  const { data: ues, isLoading } = useUnitesEnseignement(sessionId);
  const createUE = useCreateUE();
  const deleteUE = useDeleteUE();
  const createECUE = useCreateECUE();
  const deleteECUE = useDeleteECUE();

  const [openUE, setOpenUE] = useState(false);
  const [codeUE, setCodeUE] = useState("");
  const [nomUE, setNomUE] = useState("");

  const [openECUE, setOpenECUE] = useState(false);
  const [selectedUE, setSelectedUE] = useState<string | null>(null);
  const [codeECUE, setCodeECUE] = useState("");
  const [nomECUE, setNomECUE] = useState("");
  const [creditsECUE, setCreditsECUE] = useState("1");

  const handleSubmitUE = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codeUE || !nomUE) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await createUE.mutateAsync({
        session_id: sessionId,
        code: codeUE,
        nom: nomUE,
        credits_totaux: 0,
        ordre: ues?.length || 0,
      });
      toast.success("UE ajoutée");
      setOpenUE(false);
      setCodeUE("");
      setNomUE("");
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleSubmitECUE = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codeECUE || !nomECUE || !selectedUE) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const ue = ues?.find(u => u.id === selectedUE);
    const ordre = ue?.ecue?.length || 0;

    try {
      await createECUE.mutateAsync({
        ecue: {
          ue_id: selectedUE,
          code: codeECUE,
          nom: nomECUE,
          credits: parseInt(creditsECUE) || 1,
          ordre,
        },
        sessionId,
      });
      toast.success("ECUE ajoutée");
      setOpenECUE(false);
      setCodeECUE("");
      setNomECUE("");
      setCreditsECUE("1");
      setSelectedUE(null);
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDeleteUE = async (id: string) => {
    try {
      await deleteUE.mutateAsync({ id, sessionId });
      toast.success("UE supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteECUE = async (id: string) => {
    try {
      await deleteECUE.mutateAsync({ id, sessionId });
      toast.success("ECUE supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const openAddECUE = (ueId: string) => {
    setSelectedUE(ueId);
    setOpenECUE(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Unités d'Enseignement (UE)</CardTitle>
        <Dialog open={openUE} onOpenChange={setOpenUE}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une UE
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmitUE}>
              <DialogHeader>
                <DialogTitle>Ajouter une Unité d'Enseignement</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle UE pour cette session.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="codeUE">Code UE</Label>
                  <Input
                    id="codeUE"
                    placeholder="Ex: UE301"
                    value={codeUE}
                    onChange={(e) => setCodeUE(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nomUE">Nom de l'UE</Label>
                  <Input
                    id="nomUE"
                    placeholder="Ex: Programmation Avancée"
                    value={nomUE}
                    onChange={(e) => setNomUE(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenUE(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createUE.isPending}>
                  {createUE.isPending ? "Ajout..." : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {ues && ues.length > 0 ? (
          <Accordion type="multiple" className="space-y-2">
            {ues.map((ue) => {
              const totalCredits = ue.ecue?.reduce((acc, e) => acc + e.credits, 0) || 0;
              return (
                <AccordionItem key={ue.id} value={ue.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{ue.code}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{ue.nom}</span>
                      <Badge variant="secondary">{totalCredits} crédits</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {ue.ecue && ue.ecue.length > 0 ? (
                        <div className="space-y-2">
                          {ue.ecue.map((ecue) => (
                            <div 
                              key={ecue.id} 
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{ecue.code}</span>
                                <span className="text-muted-foreground">-</span>
                                <span>{ecue.nom}</span>
                                <Badge variant="outline">{ecue.credits} cr.</Badge>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer cette ECUE ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action supprimera également toutes les notes associées.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteECUE(ecue.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucune ECUE dans cette UE</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openAddECUE(ue.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter une ECUE
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer l'UE
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette UE ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action supprimera l'UE, toutes ses ECUE et les notes associées.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUE(ue.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucune UE pour le moment. Ajoutez-en une pour commencer.
            </p>
          </div>
        )}
      </CardContent>

      {/* Dialog for adding ECUE */}
      <Dialog open={openECUE} onOpenChange={setOpenECUE}>
        <DialogContent>
          <form onSubmit={handleSubmitECUE}>
            <DialogHeader>
              <DialogTitle>Ajouter une ECUE</DialogTitle>
              <DialogDescription>
                Ajoutez un élément constitutif à l'UE sélectionnée.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="codeECUE">Code ECUE</Label>
                <Input
                  id="codeECUE"
                  placeholder="Ex: ECUE301.1"
                  value={codeECUE}
                  onChange={(e) => setCodeECUE(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nomECUE">Nom de l'ECUE</Label>
                <Input
                  id="nomECUE"
                  placeholder="Ex: Algorithmes et Structures de Données"
                  value={nomECUE}
                  onChange={(e) => setNomECUE(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="creditsECUE">Crédits</Label>
                <Input
                  id="creditsECUE"
                  type="number"
                  min="1"
                  max="30"
                  value={creditsECUE}
                  onChange={(e) => setCreditsECUE(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenECUE(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createECUE.isPending}>
                {createECUE.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
