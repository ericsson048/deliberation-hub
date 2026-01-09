import { useParams, useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useEtudiants } from "@/hooks/useEtudiants";
import { useUnitesEnseignement } from "@/hooks/useUE";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, BookOpen, FileSpreadsheet, FileDown, Loader2 } from "lucide-react";
import { EtudiantsTab } from "@/components/EtudiantsTab";
import { UETab } from "@/components/UETab";
import { NotesTab } from "@/components/NotesTab";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading: sessionLoading } = useSession(id);
  const { data: etudiants } = useEtudiants(id);
  const { data: ues } = useUnitesEnseignement(id);

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground mb-4">Session non trouvée</p>
        <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {session.filiere} - {session.niveau}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {session.annee_academique} • {session.semestre}
                </p>
              </div>
            </div>
            <Button variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="etudiants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="etudiants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Étudiants ({etudiants?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="matieres" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Matières ({ues?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="etudiants">
            <EtudiantsTab sessionId={id!} />
          </TabsContent>

          <TabsContent value="matieres">
            <UETab sessionId={id!} />
          </TabsContent>

          <TabsContent value="notes">
            <NotesTab sessionId={id!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
