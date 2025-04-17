
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Link, Activity, Instagram } from "lucide-react";
import Contributors from "@/components/Contributors";

const Index = () => {
  const { loadUser, user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <Layout>
      <div className="space-y-16 max-w-5xl mx-auto">
        {/* Hero Section */}
        <section className="text-center py-12 space-y-6 animate-fade-in">
          <h1 className="text-5xl font-bold">
            <span className="text-white">ICS</span>
            <span className="text-[rgb(255,179,209)] pink-glow animate-glow">W</span>
            <span className="text-white"> Script Haven</span>
          </h1>
          <div className="w-40 h-1 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent mx-auto"></div>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto">
            Premium scripts for your favorite games with excellent support and secure payment options.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <Button 
              asChild
              className="button-3d px-6 py-6 text-lg rounded-md shine-effect"
              size="lg"
            >
              <a 
                href="https://discord.gg/3CFe4KBks2" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <Link className="mr-2" size={20} />
                Join Discord
              </a>
            </Button>
            
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span className="text-green-400 text-sm">Status: Online</span>
            </div>
          </div>
        </section>

        {/* Supported Maps & Executors */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassCard className="hover-scale feature-card">
              <h2 className="text-xl font-semibold mb-4 text-pink-DEFAULT">Supported Maps</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <span className="h-2 w-2 bg-pink-DEFAULT rounded-full mr-2"></span>
                  <span>AnimeFruit</span>
                </li>
                <li className="flex items-center">
                  <span className="h-2 w-2 bg-pink-DEFAULT rounded-full mr-2"></span>
                  <span>Basketball Legends</span>
                </li>
              </ul>
            </GlassCard>
            
            <GlassCard className="hover-scale feature-card">
              <h2 className="text-xl font-semibold mb-4 text-pink-DEFAULT">Supported Executors</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <span className="h-2 w-2 bg-pink-DEFAULT rounded-full mr-2"></span>
                  <span>Awp</span>
                </li>
                <li className="flex items-center">
                  <span className="h-2 w-2 bg-pink-DEFAULT rounded-full mr-2"></span>
                  <span>Wave</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </section>

        {/* Contributors Section */}
        <Contributors />
      </div>
    </Layout>
  );
};

export default Index;
