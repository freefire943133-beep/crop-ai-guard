import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  onAnalysisComplete: (scanId: string) => void;
}

export const ImageUpload = ({ onAnalysisComplete }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file.",
      });
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("crop-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("crop-images")
        .getPublicUrl(fileName);

      // Call edge function to analyze image
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-crop",
        {
          body: { imageUrl: publicUrl },
        }
      );

      if (analysisError) throw analysisError;

      // Save scan to database
      const { data: scanData, error: scanError } = await supabase
        .from("crop_scans")
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          crop_type: analysisData.cropType,
          disease_detected: analysisData.disease,
          confidence_score: analysisData.confidence,
          severity: analysisData.severity,
          treatment_recommendations: analysisData.treatment,
        })
        .select()
        .single();

      if (scanError) throw scanError;

      toast({
        title: "Analysis complete!",
        description: "Your crop has been analyzed successfully.",
      });

      onAnalysisComplete(scanData.id);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow-lg border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
      <CardContent className="p-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
        
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Crop preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing your crop...</span>
              </div>
            ) : (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                Upload Different Image
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-6 bg-primary/10 rounded-full">
                <Camera className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Upload Crop Image</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Take a photo or upload an image of your crop for AI analysis
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="hero"
              size="lg"
              disabled={uploading}
              className="w-full"
            >
              <Upload className="mr-2 h-5 w-5" />
              Choose Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
