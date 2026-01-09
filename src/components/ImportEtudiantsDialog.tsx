import { useState, useRef } from "react";
import * as XLSX from "xlsx";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertCircle, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportEtudiantsDialogProps {
  sessionId: string;
}

interface ParsedStudent {
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance?: string | null;
  lieu_naissance?: string | null;
  valid: boolean;
  error?: string;
}

export function ImportEtudiantsDialog({ sessionId }: ImportEtudiantsDialogProps) {
  const [open, setOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const resetState = () => {
    setParsedData([]);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const extension = file.name.split(".").pop()?.toLowerCase();

    try {
      if (extension === "csv") {
        await parseCSV(file);
      } else if (extension === "xlsx" || extension === "xls") {
        await parseExcel(file);
      } else {
        toast.error("Format non supporté. Utilisez CSV ou Excel (.xlsx, .xls)");
        resetState();
      }
    } catch (error) {
      console.error("Erreur parsing:", error);
      toast.error("Erreur lors de la lecture du fichier");
      resetState();
    }
  };

  const parseCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    
    if (lines.length < 2) {
      toast.error("Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données");
      return;
    }

    // Detect delimiter (comma or semicolon)
    const delimiter = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

    const students = lines.slice(1).map((line) => parseLine(line, delimiter, headers));
    setParsedData(students);
  };

  const parseExcel = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1 });

    if (data.length < 2) {
      toast.error("Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données");
      return;
    }

    const headers = (data[0] as string[]).map((h) => String(h || "").trim().toLowerCase());
    const students = data.slice(1).map((row: any) => {
      const values = row as any[];
      return parseRowFromHeaders(values, headers);
    });

    setParsedData(students.filter((s) => s.matricule || s.nom || s.prenom));
  };

  const parseLine = (line: string, delimiter: string, headers: string[]): ParsedStudent => {
    const values = line.split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ""));
    return parseRowFromHeaders(values, headers);
  };

  const parseRowFromHeaders = (values: any[], headers: string[]): ParsedStudent => {
    const findColumn = (keywords: string[]): string => {
      for (const keyword of keywords) {
        const index = headers.findIndex((h) => h.includes(keyword));
        if (index !== -1 && values[index] !== undefined) {
          return String(values[index] || "").trim();
        }
      }
      return "";
    };

    const matricule = findColumn(["matricule", "mat", "numero", "n°", "id"]);
    const nom = findColumn(["nom", "name", "surname"]);
    const prenom = findColumn(["prenom", "prénom", "firstname", "first"]);
    const dateNaissance = findColumn(["date", "naissance", "birth", "ddn"]);
    const lieuNaissance = findColumn(["lieu", "place", "ville"]);

    const errors: string[] = [];
    if (!matricule) errors.push("Matricule manquant");
    if (!nom) errors.push("Nom manquant");
    if (!prenom) errors.push("Prénom manquant");

    return {
      matricule,
      nom,
      prenom,
      date_naissance: dateNaissance || null,
      lieu_naissance: lieuNaissance || null,
      valid: errors.length === 0,
      error: errors.length > 0 ? errors.join(", ") : undefined,
    };
  };

  const handleImport = async () => {
    const validStudents = parsedData.filter((s) => s.valid);
    
    if (validStudents.length === 0) {
      toast.error("Aucun étudiant valide à importer");
      return;
    }

    setIsLoading(true);

    try {
      const studentsToInsert = validStudents.map((s) => ({
        session_id: sessionId,
        matricule: s.matricule,
        nom: s.nom,
        prenom: s.prenom,
        date_naissance: s.date_naissance || null,
        lieu_naissance: s.lieu_naissance || null,
      }));

      const { error } = await supabase.from("etudiants").insert(studentsToInsert);

      if (error) throw error;

      toast.success(`${validStudents.length} étudiant(s) importé(s) avec succès`);
      queryClient.invalidateQueries({ queryKey: ["etudiants", sessionId] });
      setOpen(false);
      resetState();
    } catch (error: any) {
      console.error("Erreur import:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("Certains matricules existent déjà");
      } else {
        toast.error("Erreur lors de l'importation");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validCount = parsedData.filter((s) => s.valid).length;
  const invalidCount = parsedData.filter((s) => !s.valid).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importer CSV/Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Importer des étudiants</DialogTitle>
          <DialogDescription>
            Importez une liste d'étudiants depuis un fichier CSV ou Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File input */}
          <div className="grid gap-2">
            <Label htmlFor="file">Fichier (CSV ou Excel)</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
            {fileName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <FileSpreadsheet className="h-4 w-4" />
                {fileName}
              </p>
            )}
          </div>

          {/* Format help */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Format attendu :</strong> Le fichier doit contenir les colonnes : 
              <code className="mx-1 px-1 bg-muted rounded">matricule</code>, 
              <code className="mx-1 px-1 bg-muted rounded">nom</code>, 
              <code className="mx-1 px-1 bg-muted rounded">prenom</code>. 
              Optionnel : <code className="px-1 bg-muted rounded">date_naissance</code>, 
              <code className="px-1 bg-muted rounded">lieu_naissance</code>.
            </AlertDescription>
          </Alert>

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Aperçu ({parsedData.length} lignes)</Label>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="h-4 w-4" /> {validCount} valides
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <X className="h-4 w-4" /> {invalidCount} erreurs
                    </span>
                  )}
                </div>
              </div>
              
              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">État</TableHead>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Date naiss.</TableHead>
                      <TableHead>Lieu naiss.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((student, index) => (
                      <TableRow key={index} className={!student.valid ? "bg-destructive/10" : ""}>
                        <TableCell>
                          {student.valid ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <span title={student.error}>
                              <X className="h-4 w-4 text-destructive" />
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{student.matricule || "-"}</TableCell>
                        <TableCell>{student.nom || "-"}</TableCell>
                        <TableCell>{student.prenom || "-"}</TableCell>
                        <TableCell>{student.date_naissance || "-"}</TableCell>
                        <TableCell>{student.lieu_naissance || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={validCount === 0 || isLoading}
          >
            {isLoading ? "Importation..." : `Importer ${validCount} étudiant(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
