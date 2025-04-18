import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import { useMobile } from '../hooks/use-mobile';
import { useToast } from '../hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const isMobile = useMobile();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // ดึง nickname และ balance จาก profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname, balance')
          .eq('id', session.user.id)
          .single();
        if (data) {
          setNickname(data.nickname);
          setBalance(data.balance || 0);
        }
        if (error) {
          toast({ title: 'Error', description: 'Failed to fetch user data' });
        }
      }
    };
    fetchUser();

    // ฟังการเปลี่ยนแปลง session
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        fetchUser();
      } else {
        setNickname(null);
        setBalance(0);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Success', description: 'Logged out successfully' });
    navigate('/');
  };

  return (
    <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img className="h-8 w-auto" src="/logo.svg" alt="Logo" />
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <Link to="/store" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
              Store
            </Link>
            <Link to="/script" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
              Script
            </Link>
            <Link to="/support" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
              Support
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="user-balance">
                    <span className="text-sm font-medium">{nickname || 'User'}</span>
                    <span className="text-xs text-muted-foreground ml-2">{balance} THB</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/history">History</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/reset-hwid">Reset HWID</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="default">Login</Button>
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button variant="ghost" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="sm:hidden mobile-nav">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/store" className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium">
              Store
            </Link>
            <Link to="/script" className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium">
              Script
            </Link>
            <Link to="/support" className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium">
              Support
            </Link>
            {user ? (
              <>
                <Link to="/profile" className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium">
                  Profile
                </Link>
                <Link to="/history" className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium">
                  History
                </Link>
                <Link to="/reset-hwid" className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium">
                  Reset HWID
                </Link>
                <Button variant="ghost" onClick={handleLogout} className="block w-full text-left px-3 py-2">
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth" className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}