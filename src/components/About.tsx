import { Card, CardContent } from "@/components/ui/card";
import { Brain, Sprout, TrendingUp } from "lucide-react";

export const About = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Advanced AI for <span className="text-primary">Crop Protection</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Crop diseases cost farmers billions annually and threaten global food security. 
            Our AI-powered solution combines cutting-edge image recognition with environmental 
            data analysis to detect diseases early, recommend treatments, and help farmers 
            make informed decisions for sustainable agriculture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary/50 transition-colors hover:shadow-lg group">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6 group-hover:scale-110 transition-transform">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Technology</h3>
              <p className="text-muted-foreground">
                Advanced machine learning models trained on thousands of crop images 
                for accurate disease identification
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors hover:shadow-lg group">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6 group-hover:scale-110 transition-transform">
                <Sprout className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sustainable Farming</h3>
              <p className="text-muted-foreground">
                Reduce crop loss, minimize chemical use, and increase yield through 
                early detection and precise treatment
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors hover:shadow-lg group">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Better Yields</h3>
              <p className="text-muted-foreground">
                Protect your investment with data-driven insights that lead to 
                healthier crops and improved productivity
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
