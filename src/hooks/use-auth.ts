
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function useAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error("Error checking session:", error);
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      // Vérifier d'abord si une session existe pour éviter les erreurs
      const session = await checkSession();
      if (!session) {
        // Si pas de session, rediriger directement vers la page d'auth
        navigate("/auth");
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erreur lors de la déconnexion:", error);
        toast({
          title: "Erreur",
          description: "Impossible de se déconnecter",
          variant: "destructive",
        });
        return;
      }
      
      navigate("/auth");
    } catch (error) {
      console.error("Exception lors de la déconnexion:", error);
      // En cas d'erreur, rediriger quand même vers la page d'auth
      navigate("/auth");
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await checkSession();
        if (!session) {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Error in checkUser:", error);
        navigate("/auth");
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return {
    handleLogout,
    checkSession
  };
}
