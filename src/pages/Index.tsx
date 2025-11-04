import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { ImageUpload } from "@/components/ImageUpload";
import { DiseaseResult } from "@/components/DiseaseResult";
import { Dashboard } from "@/components/Dashboard";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Leaf, LogOut, Upload, BarChart3, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type View = "dashboard" | "upload" | "result";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setShowLanding(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowLanding(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  const handleBackToLanding = () => {
    if (!user) {
      setShowLanding(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowLanding(true);
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

  // Show landing page
  if (showLanding && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onGetStarted={handleGetStarted} />
        <main>
          <Hero onGetStarted={handleGetStarted} />
          <About />
          <Features />
        </main>
        <Footer />
      </div>
    );
  }

  // Show auth if not logged in and user clicked get started
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 py-8">
          <Button
            onClick={handleBackToLanding}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <Auth />
        </div>
      </div>
    );
  }

  // Show authenticated user dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navbar onGetStarted={() => setCurrentView("upload")} />
      
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
