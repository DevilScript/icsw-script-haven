import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          toast({
            title: "Error",
            description: "Unable to get session data, please try again",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        if (data.session) {
          const user = data.session.user;
          const userMetadata = user?.user_metadata || {};

          // Try to get the best display name
          const discordGlobalName =
            userMetadata.full_name ||
            userMetadata.display_name ||
            userMetadata.global_name ||
            userMetadata.name ||
            userMetadata.username ||
            "User";

          const username = user.email || user.id;
          console.log(
            "Full user_metadata:",
            JSON.stringify(userMetadata, null, 2)
          );

          // Update or insert user data in user_id table
          const { error: upsertError } = await supabase
            .from("user_id")
            .upsert(
              {
                id: user.id,
                username: username,
                nickname: discordGlobalName,
                created_at: new Date().toISOString(),
              },
              {
                onConflict: "id",
              }
            );

          if (upsertError) {
            console.error("Error upserting user_id:", upsertError);
            toast({
              title: "Error",
              description: "Could not update user data, please contact support",
              variant: "destructive",
            });
            navigate("/auth");
            return;
          }

          toast({
            title: "Success",
            description: `Welcome, ${discordGlobalName}!`,
          });

          if (window.opener) {
            try {
              // Notify the opener window about successful login
              window.opener.postMessage("auth-successful", window.location.origin);
              // Delay closing to ensure postMessage is sent
              setTimeout(() => {
                window.close();
                // Fallback: Try closing again after a short delay
                setTimeout(() => {
                  if (!window.closed) window.close();
                }, 500);
              }, 300);
            } catch (err) {
              console.error("Error communicating with opener window:", err);
              // Do not navigate in popup, just attempt to close again
              setTimeout(() => window.close(), 300);
            }
          } else {
            navigate("/");
          }
        } else {
          toast({
            title: "Error",
            description: "No session found, please try again",
            variant: "destructive",
          });
          navigate("/auth");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        navigate("/auth");
      }
    }

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Login</h1>
        <p className="text-gray-400 mb-6">
          Please wait while we verify your details...
        </p>
        <Button disabled className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </Button>
      </div>
    </div>
  );
}