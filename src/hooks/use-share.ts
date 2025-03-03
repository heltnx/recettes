
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useShare() {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareURL, setShareURL] = useState("");

  const generateShareLink = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // Demander à l'utilisateur de saisir son nom
    const sharedByName = prompt("Entrez votre nom pour le partage:", "");
    
    // Si l'utilisateur annule le prompt, on arrête le processus
    if (sharedByName === null) return;
    
    // Mettre à jour toutes les recettes de cet utilisateur avec le nom saisi
    const { error: updateError } = await supabase
      .from("recipes")
      .update({ shared_by_name: sharedByName })
      .eq('user_id', session.user.id);
      
    if (updateError) {
      console.error("Erreur lors de la mise à jour du nom:", updateError);
    }
    
    const shareUrl = `${window.location.origin}/shared?user=${session.user.id}`;
    setShareURL(shareUrl);
    setShowShareDialog(true);
  };

  return {
    showShareDialog,
    setShowShareDialog,
    shareURL,
    generateShareLink
  };
}
