import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/lib/auth';
import { signInWithDiscord } from '@/lib/supabase';

const AuthPage = () => {
  const [username, setUsername] = useState('');
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const { login, isLoading } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username) {
      toast({
        title: 'Error',
        description: 'Please enter a username',
        variant: 'destructive',
      });
      return;
    }

    const success = await login(username);
    if (success) {
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      navigate('/');
    } else {
      toast({
        title: 'Error',
        description: 'Failed to login',
        variant: 'destructive',
      });
    }
  };

  const handleDiscordLogin = async () => {
    setIsDiscordLoading(true);
    try {
      await signInWithDiscord();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate Discord login',
        variant: 'destructive',
      });
      setIsDiscordLoading(false);
    }
  };

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data.type === 'auth_success') {
        setIsDiscordLoading(false);
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
        navigate('/');
      } else if (event.data.type === 'auth_error') {
        setIsDiscordLoading(false);
        toast({
          title: 'Error',
          description: event.data.message || 'Authentication failed',
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [navigate, toast]);

  return (
    <Layout>
      <div className="max-w-md mx-auto py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Login</h1>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-pink-DEFAULT hover:bg-pink-hover"
          >
            {isLoading ? 'Loading...' : 'Login with Username'}
          </Button>
          <Button
            onClick={handleDiscordLogin}
            disabled={isDiscordLoading}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
          >
            {isDiscordLoading ? 'Loading...' : 'Login with Discord'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;