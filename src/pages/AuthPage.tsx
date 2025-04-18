import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message });
    } else {
      toast({ title: 'Success', description: 'Logged in successfully' });
      navigate('/');
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
      toast({ title: 'Error', description: error.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Login with Email'}
            </Button>
          </form>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={handleDiscordLogin}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Loading...' : 'Login with Discord'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}