
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import Contributors from "@/components/Contributors";
import { useAuthStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { FileText, ShoppingCart, CreditCard } from "lucide-react";

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
            <span className="text-pink-DEFAULT animate-glow">W</span>
            <span className="text-white"> Script Haven</span>
          </h1>
          <div className="w-40 h-1 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent mx-auto"></div>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto">
            Premium scripts for your favorite games with excellent support and secure payment options.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <Button 
              onClick={() => navigate("/script")}
              className="bg-pink-transparent border border-pink-pastel hover:bg-pink-hover shine-effect"
              size="lg"
            >
              <FileText className="mr-2" size={18} />
              View Scripts
            </Button>
            
            <Button 
              onClick={() => navigate("/store")}
              variant="outline" 
              size="lg"
              className="bg-transparent border-pink-pastel hover:bg-pink-transparent shine-effect"
            >
              <ShoppingCart className="mr-2" size={18} />
              Visit Store
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="relative">
              Features
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <GlassCard className="hover-scale">
              <h3 className="text-xl font-semibold mb-4 text-pink-DEFAULT">Premium Scripts</h3>
              <p className="text-gray-300">Access high-quality scripts designed for optimal gameplay and features.</p>
            </GlassCard>
            
            <GlassCard className="hover-scale">
              <h3 className="text-xl font-semibold mb-4 text-pink-DEFAULT">Easy Payments</h3>
              <p className="text-gray-300">Simple TrueMoney Wallet topup system for quick and hassle-free transactions.</p>
            </GlassCard>
            
            <GlassCard className="hover-scale">
              <h3 className="text-xl font-semibold mb-4 text-pink-DEFAULT">Discord Support</h3>
              <p className="text-gray-300">Join our active Discord community for instant support and updates.</p>
            </GlassCard>
          </div>
        </section>

        {/* Contributors Section */}
        <Contributors />

        {/* CTA Section */}
        <section className="py-12 text-center">
          <GlassCard className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-gray-300 mb-6">
              Top up your account and get instant access to premium scripts
            </p>
            <Button
              onClick={() => navigate("/topup")}
              className="bg-pink-transparent border border-pink-pastel hover:bg-pink-hover shine-effect"
              size="lg"
            >
              <CreditCard className="mr-2" size={18} />
              Topup Now
            </Button>
          </GlassCard>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
