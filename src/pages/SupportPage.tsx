
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import MapIndicator from "@/components/MapIndicator";

const SupportPage = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          <span className="relative">
            Support
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
          </span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <GlassCard className="hover-scale">
            <h2 className="text-xl font-semibold mb-4">Supported Maps</h2>
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
          
          <GlassCard className="hover-scale">
            <h2 className="text-xl font-semibold mb-4">Supported Executors</h2>
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
        
        <GlassCard className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Contact Support</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg text-pink-DEFAULT mb-2">Discord Server</h3>
              <p className="text-gray-300 mb-2">
                Join our Discord server for the fastest support:
              </p>
              <a 
                href="https://discord.gg/3CFe4KBks2" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pink-DEFAULT hover:text-pink-hover underline"
              >
                discord.gg/3CFe4KBks2
              </a>
            </div>
            
            <div>
              <h3 className="text-lg text-pink-DEFAULT mb-2">Developer Contact</h3>
              <p className="text-gray-300 mb-2">
                Contact our lead developer Mo directly:
              </p>
              <a 
                href="https://www.instagram.com/mo.icsw/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pink-DEFAULT hover:text-pink-hover underline"
              >
                instagram.com/mo.icsw
              </a>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard>
          <h2 className="text-xl font-semibold mb-6">FAQ</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg text-pink-DEFAULT mb-2">How do I use my script key?</h3>
              <p className="text-gray-300">
                Once you purchase a script, you'll receive a key. Go to the Script page, 
                select the map you purchased, enter your key, and the script will be displayed.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg text-pink-DEFAULT mb-2">How long is my key valid?</h3>
              <p className="text-gray-300">
                Your script key is valid indefinitely unless otherwise specified. If you encounter 
                any issues, please contact our support team on Discord.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg text-pink-DEFAULT mb-2">I lost my key. What should I do?</h3>
              <p className="text-gray-300">
                Your key is stored in your profile if you're logged in. If you're unable to find it,
                please contact support on Discord with proof of purchase.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
};

export default SupportPage;
