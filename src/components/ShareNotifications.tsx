import { useState, useEffect } from "react";
import { useRecipeShares } from "@/hooks/use-recipe-shares";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ShareNotifications() {
  const { 
    incomingShares, 
    isLoading, 
    hasNewShares, 
    clearNewSharesFlag,
    acceptShare,
    rejectShare,
    fetchIncomingShares
  } = useRecipeShares();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isOpen) {
      clearNewSharesFlag();
      setError(null);
      
      // Ajouter un délai pour éviter trop de requêtes
      timeoutId = setTimeout(() => {
        fetchIncomingShares().catch(err => {
          console.error("Erreur lors du chargement des partages:", err);
          setError("Impossible de charger les partages de recettes");
        });
      }, 500);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, clearNewSharesFlag, fetchIncomingShares]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNewShares && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center">
              {incomingShares?.length || 0}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recettes partagées avec vous</DialogTitle>
          <DialogDescription>
            Vos recettes en attente de validation
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">
                Chargement des recettes partagées...
              </p>
            </div>
          ) : incomingShares?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Aucune recette partagée en attente
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Les recettes partagées avec vous apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {incomingShares?.map((share) => (
                <Card key={share.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{share.recipe?.title || "Recette sans titre"}</CardTitle>
                    <CardDescription className="text-xs">
                      Catégorie: {share.recipe?.category || "Non spécifiée"}
                      {share.recipe?.sub_category && ` - ${share.recipe?.sub_category}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => rejectShare(share)}
                      >
                        Refuser
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => acceptShare(share)}
                      >
                        Accepter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-between items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setError(null);
              fetchIncomingShares();
            }}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <Loader2 className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
