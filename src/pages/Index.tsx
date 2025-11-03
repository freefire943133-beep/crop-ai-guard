import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { ImageUpload } from "@/components/ImageUpload";
import { DiseaseResult } from "@/components/DiseaseResult";
import { Dashboard } from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { Leaf, LogOut, Upload, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-crops.jpg";

type View = "dashboard" | "upload" | "result";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const handleAnalysisComplete = (scanId: string) => {
    setCurrentScanId(scanId);
    setCurrentView("result");
  };

  const handleViewScan = (scanId: string) => {
    setCurrentScanId(scanId);
    setCurrentView("result");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-2 text-primary">
          <Leaf className="h-8 w-8" />
          <span className="text-xl font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="relative h-[300px] overflow-hidden">
        <img
          src={heroImage}
          alt="Agricultural crops"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                  <Leaf className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  CropGuard AI
                </h1>
              </div>
              <p className="text-xl text-white/90 mb-6">
                AI-powered crop disease prediction and management
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentView("upload")}
                  variant="hero"
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Upload className="h-5 w-5" />
                  New Scan
                </Button>
                <Button
                  onClick={() => setCurrentView("dashboard")}
                  variant="outline"
                  size="lg"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  <BarChart3 className="h-5 w-5" />
                  Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentView("dashboard")}
              variant={currentView === "dashboard" ? "default" : "ghost"}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              onClick={() => setCurrentView("upload")}
              variant={currentView === "upload" ? "default" : "ghost"}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          {currentView === "dashboard" && <Dashboard onViewScan={handleViewScan} />}
          {currentView === "upload" && <ImageUpload onAnalysisComplete={handleAnalysisComplete} />}
          {currentView === "result" && currentScanId && <DiseaseResult scanId={currentScanId} />}
        </div>
      </div>
    </div>
  );
};

export default Index;
