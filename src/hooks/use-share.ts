
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useShare() {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareURL, setShareURL] = useState("");

  const generateShareLink = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
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
