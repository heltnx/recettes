
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useShare() {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareURL, setShareURL] = useState("");
  const { toast } = useToast();

  const generateShareLink = async (userDisplayName: string) => {
    // Récupérer la session de l'utilisateur
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    try {
      // Mettre à jour toutes les recettes de l'utilisateur avec son nom
      const { error } = await supabase
        .from("recipes")
        .update({ shared_by_name: userDisplayName })
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Erreur de mise à jour du nom:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer votre nom",
          variant: "destructive",
        });
        return;
      }
      
      // Générer l'URL de partage
      const shareUrl = `${window.location.origin}/shared?user=${session.user.id}`;
      setShareURL(shareUrl);
      setShowShareDialog(true);
    } catch (error) {
      console.error("Erreur lors du partage:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du partage",
        variant: "destructive",
      });
    }
  };

  return {
    showShareDialog,
    setShowShareDialog,
    shareURL,
    generateShareLink
  };
}
