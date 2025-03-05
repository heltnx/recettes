
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
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  useEffect(() => {
    if (isOpen) {
      clearNewSharesFlag();
      // Recharger les partages quand on ouvre la boîte de dialogue
      fetchIncomingShares();
    }
  }, [isOpen, clearNewSharesFlag, fetchIncomingShares]);

  console.log("ShareNotifications - incomingShares:", incomingShares.length, "hasNewShares:", hasNewShares);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNewShares && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center">
              {incomingShares.length}
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
          {isLoading ? (
            <p className="text-center py-4">Chargement...</p>
          ) : incomingShares.length === 0 ? (
            <p className="text-center py-4">Aucune recette partagée en attente</p>
          ) : (
            <div className="space-y-4 py-2">
              {incomingShares.map((share) => (
                <Card key={share.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{share.recipe?.title}</CardTitle>
                    <CardDescription className="text-xs">
                      Catégorie: {share.recipe?.category}
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
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
