import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateSession } from "@/hooks/useSession";
import { toast } from "sonner";

export function CreateSessionDialog() {
  const [open, setOpen] = useState(false);
  const [anneeAcademique, setAnneeAcademique] = useState("");
  const [semestre, setSemestre] = useState("");
  const [filiere, setFiliere] = useState("");
  const [niveau, setNiveau] = useState("");
  const [dateDeliberation, setDateDeliberation] = useState("");

  const createSession = useCreateSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!anneeAcademique || !semestre || !filiere || !niveau) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await createSession.mutateAsync({
        annee_academique: anneeAcademique,
        semestre,
        filiere,
        niveau,
        date_deliberation: dateDeliberation || null,
      });
      toast.success("Session créée avec succès");
      setOpen(false);
      // Reset form
      setAnneeAcademique("");
      setSemestre("");
      setFiliere("");
      setNiveau("");
      setDateDeliberation("");
    } catch (error) {
      toast.error("Erreur lors de la création de la session");
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return `${year}-${year + 1}`;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer une session de délibération</DialogTitle>
            <DialogDescription>
              Configurez les informations de base pour cette session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="annee">Année académique *</Label>
              <Select value={anneeAcademique} onValueChange={setAnneeAcademique}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'année" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="semestre">Semestre *</Label>
              <Select value={semestre} onValueChange={setSemestre}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">Semestre 1</SelectItem>
                  <SelectItem value="S2">Semestre 2</SelectItem>
                  <SelectItem value="Annuel">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filiere">Filière *</Label>
              <Input
                id="filiere"
                placeholder="Ex: Informatique, Mathématiques..."
                value={filiere}
                onChange={(e) => setFiliere(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="niveau">Niveau *</Label>
              <Select value={niveau} onValueChange={setNiveau}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAC 1">BAC 1</SelectItem>
                  <SelectItem value="BAC 2">BAC 2</SelectItem>
                  <SelectItem value="BAC 3">BAC 3</SelectItem>
                  <SelectItem value="Master 1">Master 1</SelectItem>
                  <SelectItem value="Master 2">Master 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date de délibération</Label>
              <Input
                id="date"
                type="date"
                value={dateDeliberation}
                onChange={(e) => setDateDeliberation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
