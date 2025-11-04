import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Zap, LineChart, Shield, Clock, Leaf } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: Camera,
      title: "Image-Based Disease Detection",
      description: "Simply upload or capture a photo of your crop. Our AI analyzes visual symptoms to identify diseases with high accuracy.",
      color: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
    },
    {
      icon: Zap,
      title: "Real-Time Recommendations",
      description: "Get instant treatment suggestions tailored to the specific disease, severity level, and crop type detected.",
      color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
    },
    {
      icon: LineChart,
      title: "Severity Assessment",
      description: "Understand the urgency with severity ratings from low to high, helping you prioritize treatment actions.",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
    },
    {
      icon: Shield,
      title: "Preventive Care Tips",
      description: "Receive guidance on preventing future outbreaks through proper drainage, crop rotation, and maintenance practices.",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
    },
    {
      icon: Clock,
      title: "Historical Tracking",
      description: "Monitor your farm's health over time with saved scans and analysis history for better long-term planning.",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
    },
    {
      icon: Leaf,
      title: "Multi-Crop Support",
      description: "Works with various crop types including wheat, corn, rice, potatoes, and many more agricultural plants.",
      color: "bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400"
    }
  ];

  return (
    <section id="features" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Powerful Features for <span className="text-primary">Modern Farming</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to protect your crops and maximize your harvest
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <CardHeader>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
