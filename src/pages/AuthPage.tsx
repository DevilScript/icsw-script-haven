import { useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Logged in successfully" });
    }
  };

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: import.meta.env.VITE_SUPABASE_SITE_URL || 'http://localhost:5173/auth/callback',
        scopes: 'identify email',
      },
    });
    setIsLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-[#1a1a1a]">
      <div className="w-full max-w-md p-6 bg-[#222222]/80 backdrop-blur-md rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-pink-DEFAULT mb-6 flex items-center">
          <span className="mr-2">Login</span>
          <span className="text-white">to ICSW</span>
        </h2>
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-pink-pastel">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="key-input bg-[#2a2a2a] text-white border-pink-DEFAULT/20"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-pink-pastel">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="key-input bg-[#2a2a2a] text-white border-pink-DEFAULT/20"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full button-3d shine-effect bg-[#222222] hover:bg-[#2a2a2a]"
          >
            {isLoading ? "Loading..." : "Login with Email"}
          </Button>
        </form>
        <div className="mt-4">
          <Button
            onClick={handleDiscordLogin}
            disabled={isLoading}
            className="w-full button-3d shine-effect bg-[#222222] hover:bg-[#2a2a2a]"
          >
            {isLoading ? "Loading..." : "Login with Discord"}
          </Button>
        </div>
        <div className="mt-4 text-center">
          <NavLink to="/signup" className="text-gray-300 hover:text-pink-DEFAULT">
            Don't have an account? Sign up
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;