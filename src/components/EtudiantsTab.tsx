import { useState } from "react";
import { useEtudiants, useCreateEtudiant, useDeleteEtudiant } from "@/hooks/useEtudiants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Trash2, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ImportEtudiantsDialog } from "./ImportEtudiantsDialog";

interface EtudiantsTabProps {
  sessionId: string;
}

export function EtudiantsTab({ sessionId }: EtudiantsTabProps) {
  const { data: etudiants, isLoading } = useEtudiants(sessionId);
  const createEtudiant = useCreateEtudiant();
  const deleteEtudiant = useDeleteEtudiant();

  const [open, setOpen] = useState(false);
  const [matricule, setMatricule] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [lieuNaissance, setLieuNaissance] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matricule || !nom || !prenom) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    try {
      await createEtudiant.mutateAsync({
        session_id: sessionId,
        matricule,
        nom,
        prenom,
        date_naissance: dateNaissance || null,
        lieu_naissance: lieuNaissance || null,
      });
      toast.success("Étudiant ajouté");
      setOpen(false);
      setMatricule("");
      setNom("");
      setPrenom("");
      setDateNaissance("");
      setLieuNaissance("");
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEtudiant.mutateAsync({ id, sessionId });
      toast.success("Étudiant supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
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
        <CardTitle>Liste des étudiants</CardTitle>
        <div className="flex items-center gap-2">
          <ImportEtudiantsDialog sessionId={sessionId} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Ajouter un étudiant</DialogTitle>
                <DialogDescription>
                  Entrez les informations de l'étudiant.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="matricule">Matricule *</Label>
                  <Input
                    id="matricule"
                    placeholder="Ex: 2024/INFO/001"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      placeholder="Nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      placeholder="Prénom"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dateNaissance">Date de naissance</Label>
                    <Input
                      id="dateNaissance"
                      type="date"
                      value={dateNaissance}
                      onChange={(e) => setDateNaissance(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
                    <Input
                      id="lieuNaissance"
                      placeholder="Ville, Province"
                      value={lieuNaissance}
                      onChange={(e) => setLieuNaissance(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createEtudiant.isPending}>
                  {createEtudiant.isPending ? "Ajout..." : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {etudiants && etudiants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Date de naissance</TableHead>
                <TableHead>Lieu de naissance</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {etudiants.map((etudiant) => (
                <TableRow key={etudiant.id}>
                  <TableCell className="font-medium">{etudiant.matricule}</TableCell>
                  <TableCell>{etudiant.nom}</TableCell>
                  <TableCell>{etudiant.prenom}</TableCell>
                  <TableCell>{etudiant.date_naissance || "-"}</TableCell>
                  <TableCell>{etudiant.lieu_naissance || "-"}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cet étudiant ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Toutes les notes de cet étudiant seront également supprimées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(etudiant.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucun étudiant pour le moment. Ajoutez-en un pour commencer.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
