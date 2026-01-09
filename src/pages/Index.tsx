import { useSessions, useDeleteSession } from "@/hooks/useSession";
import { SessionCard } from "@/components/SessionCard";
import { CreateSessionDialog } from "@/components/CreateSessionDialog";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { data: sessions, isLoading } = useSessions();
  const deleteSession = useDeleteSession();

  const handleDelete = async (id: string) => {
    try {
      await deleteSession.mutateAsync(id);
      toast.success("Session supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Délibération Académique</h1>
                <p className="text-sm text-muted-foreground">
                  Système de gestion des délibérations - Université du Burundi
                </p>
              </div>
            </div>
            <CreateSessionDialog />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard 
                key={session.id} 
                session={session} 
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucune session</h2>
            <p className="text-muted-foreground mb-6">
              Commencez par créer une nouvelle session de délibération.
            </p>
            <CreateSessionDialog />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
