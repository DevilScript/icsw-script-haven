import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { signInWithDiscord } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithDiscord();
      // รอ callback ผ่าน window message
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate Discord login',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data.type === 'auth_success') {
        setIsLoading(false);
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
        navigate('/');
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [navigate, toast]);

  return (
    <Layout>
      <div className="max-w-md mx-auto py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Login</h1>
        <Button
          onClick={handleDiscordLogin}
          disabled={isLoading}
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
        >
          {isLoading ? 'Loading...' : 'Login with Discord'}
        </Button>
      </div>
    </Layout>
  );
};

export default AuthPage;