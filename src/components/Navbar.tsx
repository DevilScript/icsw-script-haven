
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { HelpCircle, Menu, X, LogIn, History, Key, ChevronDown, Wallet, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/auth";
import { sendDiscordWebhook } from "@/lib/webhook";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [discordTag, setDiscordTag] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const { user, logout } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsAtTop(currentScrollY < 50);
      setShowNavbar(currentScrollY < lastScrollY || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || user.username || 'User');
      setBalance(user.balance || 0);
    } else {
      setNickname(null);
      setBalance(0);
    }
  }, [user]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // User is logged in, fetch their data
          const { data, error } = await supabase
            .from('user_id')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (data && !error) {
            setNickname(data.nickname || data.username || 'User');
            setBalance(data.balance || 0);
          }
        } else {
          // User is logged out
          setNickname(null);
          setBalance(0);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleHelpSubmit = async () => {
    if (!helpMessage) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a message",
      });
      return;
    }

    try {
      await sendDiscordWebhook("Help Request", {
        "Discord Tag": user ? user.username : discordTag,
        "Message": helpMessage
      });

      toast({
        title: "Success",
        description: "Your message has been sent",
      });

      setHelpDialogOpen(false);
      setHelpMessage("");
      setDiscordTag("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({ 
        title: 'Success', 
        description: 'Logged out successfully' 
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
      toast({ 
        variant: 'destructive',
        title: 'Error', 
        description: 'Failed to log out' 
      });
    }
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Script", path: "/script" },
    { name: "Store", path: "/store" },
    { name: "Topup", path: "/topup" },
  ];

  const navbarClasses = `fixed w-full z-50 transition-all duration-300 ${
    isAtTop ? "py-4 bg-transparent" : "py-2 bg-black/70 backdrop-blur-lg shadow-lg"
  } ${
    showNavbar ? "translate-y-0" : "-translate-y-full"
  }`;

  return (
    <header className={navbarClasses}>
      <div className="container mx-auto px-4">
        <nav className="flex justify-between items-center">
          {/* Brand and Navigation */}
          <div className="flex items-center">
            <div className="mr-10">
              <h1 className="text-2xl font-bold">
                <span className="text-white">ICS</span>
                <span className="text-[rgb(255,179,209)] pink-glow animate-glow">W</span>
              </h1>
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></div>
            </div>
            
            <div className="hidden md:flex space-x-8 items-center">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `py-1 relative shine-effect ${
                      isActive
                        ? "text-[rgb(255,179,209)]"
                        : "text-gray-300 hover:text-white"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHelpDialogOpen(true)}
              className="text-gray-300 hover:text-white hover:bg-pink-transparent/10"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            
            {nickname ? (
              <div className="flex items-center gap-3">
                {/* Balance display with animation */}
                <div className="bg-gradient-to-r from-pink-DEFAULT/20 to-purple-600/20 p-0.5 rounded-full backdrop-blur-sm animate-pulse">
                  <div className="bg-black/40 px-3 py-1 rounded-full flex items-center group hover:bg-black/60 transition-all duration-300">
                    <Wallet className="h-4 w-4 text-pink-DEFAULT mr-1 group-hover:scale-110 transition-transform" />
                    <span className="text-pink-DEFAULT font-medium">{balance} THB</span>
                  </div>
                </div>

                {/* User dropdown with modern styling */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 text-white flex items-center gap-2 border border-pink-DEFAULT/20 hover:border-pink-DEFAULT/40 transition-all duration-300 p-2 rounded-lg hover:shadow-lg hover:shadow-pink-DEFAULT/10 hover:scale-105"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-DEFAULT to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                        {nickname.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{nickname}</span>
                        <span className="text-xs text-gray-400">User Account</span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-70 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#222222] backdrop-blur-lg text-white border-pink-DEFAULT/20 shadow-xl shadow-pink-DEFAULT/10 animate-fade-in rounded-lg overflow-hidden w-48 p-1">
                    <DropdownMenuItem asChild className="hover:bg-pink-transparent/10 rounded-md px-3 py-2 transition-colors">
                      <NavLink to="/history" className="flex items-center gap-2 w-full">
                        <History className="h-4 w-4 text-pink-DEFAULT" />
                        <span>History</span>
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-pink-transparent/10 rounded-md px-3 py-2 transition-colors">
                      <NavLink to="/reset-hwid" className="flex items-center gap-2 w-full">
                        <Key className="h-4 w-4 text-pink-DEFAULT" />
                        <span>Reset-HWID</span>
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="hover:bg-pink-transparent/10 rounded-md px-3 py-2 transition-colors mt-1 border-t border-gray-700 pt-1"
                    >
                      <LogIn className="h-4 w-4 text-pink-DEFAULT mr-2 rotate-180" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button 
                asChild
                className="bg-gradient-to-r from-pink-DEFAULT/80 to-purple-600/80 hover:from-pink-DEFAULT hover:to-purple-600 border-none shadow-lg hover:shadow-pink-DEFAULT/20 transition-all duration-300 hover:scale-105"
                size="sm"
              >
                <NavLink to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </NavLink>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-white"
            >
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </nav>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 animate-fade-in mobile-nav bg-[#1a1a1f]/90 backdrop-blur-md shadow-lg rounded-b-lg">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-md ${
                      isActive
                        ? "bg-pink-transparent text-pink-DEFAULT"
                        : "text-gray-300 hover:text-white"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
              
              {nickname ? (
                <>
                  <div className="flex items-center justify-between mx-4 px-4 py-2">
                    {/* Balance display for mobile */}
                    <div className="bg-gradient-to-r from-pink-DEFAULT/20 to-purple-600/20 p-0.5 rounded-full backdrop-blur-sm">
                      <div className="bg-black/40 px-3 py-1 rounded-full flex items-center">
                        <Wallet className="h-4 w-4 text-pink-DEFAULT mr-1" />
                        <span className="text-pink-DEFAULT font-medium">{balance} THB</span>
                      </div>
                    </div>
                    
                    {/* User display for mobile */}
                    <div className="flex items-center gap-2 bg-gradient-to-r from-gray-800/80 to-gray-900/80 px-3 py-1 rounded-full border border-pink-DEFAULT/20">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-DEFAULT to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {nickname.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{nickname}</span>
                    </div>
                  </div>
                  
                  <NavLink
                    to="/history"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-md flex items-center ${
                        isActive
                          ? "bg-pink-transparent text-pink-DEFAULT"
                          : "text-gray-300 hover:text-white"
                      }`
                    }
                  >
                    <History className="h-4 w-4 mr-2 text-pink-DEFAULT" />
                    History
                  </NavLink>
                  <NavLink
                    to="/reset-hwid"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-md flex items-center ${
                        isActive
                          ? "bg-pink-transparent text-pink-DEFAULT"
                          : "text-gray-300 hover:text-white"
                      }`
                    }
                  >
                    <Key className="h-4 w-4 mr-2 text-pink-DEFAULT" />
                    Reset-HWID
                  </NavLink>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-gray-300 hover:text-white justify-start px-4"
                  >
                    <LogIn className="h-4 w-4 mr-2 rotate-180" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button 
                  asChild
                  className="mx-4 bg-gradient-to-r from-pink-DEFAULT/80 to-purple-600/80 hover:from-pink-DEFAULT hover:to-purple-600 border-none"
                  size="sm"
                >
                  <NavLink to="/auth" onClick={() => setIsOpen(false)}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </NavLink>
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={() => {
                  setHelpDialogOpen(true);
                  setIsOpen(false);
                }}
                className="text-gray-300 hover:text-white justify-start px-4"
              >
                <HelpCircle className="h-5 w-5 mr-2" />
                Get Help
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="sm:max-w-[425px] help-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl text-pink-DEFAULT flex items-center">
              <HelpCircle className="mr-2 h-5 w-5" />
              Need Assistance?
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              We're here to help! Send us your question and we'll respond via Discord.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            {!user && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discordTag" className="text-right text-pink-pastel">
                  Discord Tag
                </Label>
                <Input
                  id="discordTag"
                  placeholder="username#1234"
                  className="col-span-3 key-input"
                  value={discordTag || ""}
                  onChange={(e) => setDiscordTag(e.target.value)}
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="message" className="text-right text-pink-pastel mt-2">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="How can we help you today?"
                className="col-span-3 key-input min-h-[120px]"
                value={helpMessage}
                onChange={(e) => setHelpMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleHelpSubmit}
              className="bg-gradient-to-r from-pink-DEFAULT/80 to-purple-600/80 hover:from-pink-DEFAULT hover:to-purple-600 transition-all duration-300 hover:scale-105"
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Navbar;
