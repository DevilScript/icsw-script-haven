import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithOAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithOAuth('discord');
    if (error) {
      console.error('Discord login failed:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to your account using Discord.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleDiscordLogin}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3853-.3969-.8748-.6083-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8851 1.515.0699.0699 0 00-.032.0277C.5336 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0311 1.7116 4.3513 2.4039 6.6959 2.4039a.084.084 0 00.0896-.0586c.5297-.7234 1.0066-1.4948 1.4046-2.2982a.0771.0771 0 00-.0427-.1066c-.2472-.1019-.504-.1859-.7679-.2707a.0762.0762 0 01-.0427-.052c.2879-1.0607.6044-2.1237.9066-3.1816a.0756.0756 0 01.1008-.0509c.5297.3748 1.0806.7227 1.6597.998a.0754.0754 0 01.0509.0873c-.2588 1.0588-.5753 2.1218-.8632 3.1816a.077.077 0 01-.0417.052c-.2638.0848-.5207.1688-.7679.2707a.0771.0771 0 00-.0427.1066c.398.8034.875.5748 1.4046 2.2982a.0781.0781 0 00.0896.0586c2.3446 0 4.6648-.6923 6.6959-2.4039a.0754.0754 0 00.0312-.0561c.4413-4.4799-.4066-9.0089-3.5858-13.6877a.0691.0691 0 00-.032-.0277zM8.3894 15.4278c-.661 0-1.207-.7227-1.207-1.6116s.536-1.6116 1.207-1.6116c.679 0 1.2161.7227 1.207 1.6116 0 .8889-.536 1.6116-1.207 1.6116zm7.2212 0c-.661 0-1.207-.7227-1.207-1.6116s.536-1.6116 1.207-1.6116c.679 0 1.2161.7227 1.207 1.6116 0 .8889-.5271 1.6116-1.207 1.6116z"
                  />
                </svg>
              )}
              Login with Discord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}