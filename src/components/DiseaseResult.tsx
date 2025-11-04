import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DiseaseResultProps {
  scanId: string;
}

export const DiseaseResult = ({ scanId }: DiseaseResultProps) => {
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const fetchScan = async () => {
      const { data, error } = await supabase
        .from("crop_scans")
        .select("*")
        .eq("id", scanId)
        .single();

      if (!error && data) {
        setScan(data);
        
        // Generate signed URL for secure image access
        if (data.image_url) {
          const { data: signedUrlData } = await supabase.storage
            .from('crop-images')
            .createSignedUrl(data.image_url, 3600); // 1 hour expiry
          
          if (signedUrlData) {
            setImageUrl(signedUrlData.signedUrl);
          }
        }
      }
      setLoading(false);
    };

    fetchScan();
  }, [scanId]);

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!scan) return null;

  const getSeverityIcon = () => {
    switch (scan.severity?.toLowerCase()) {
      case "low":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "high":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Leaf className="h-5 w-5 text-primary" />;
    }
  };

  const getSeverityColor = () => {
    switch (scan.severity?.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-primary/10 text-primary border-primary/30";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getSeverityIcon()}
                Analysis Results
              </CardTitle>
              <CardDescription className="mt-2">
                AI-powered crop disease detection
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {scan.confidence_score}% confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Crop Type</h4>
              <p className="text-lg font-semibold">{scan.crop_type || "Not identified"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Disease Detected</h4>
              <p className="text-lg font-semibold">{scan.disease_detected || "None"}</p>
            </div>
          </div>

          {scan.severity && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Severity Level</h4>
              <Badge className={getSeverityColor()}>
                {scan.severity.toUpperCase()}
              </Badge>
            </div>
          )}

          {imageUrl && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Analyzed Image</h4>
              <img
                src={imageUrl}
                alt="Crop scan"
                className="w-full h-48 object-cover rounded-lg border"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {scan.treatment_recommendations && (
        <Card className="shadow-lg bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Leaf className="h-5 w-5" />
              Treatment Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {scan.treatment_recommendations}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
