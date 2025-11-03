import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DashboardProps {
  onViewScan: (scanId: string) => void;
}

export const Dashboard = ({ onViewScan }: DashboardProps) => {
  const [scans, setScans] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    healthy: 0,
    diseased: 0,
  });

  useEffect(() => {
    const fetchScans = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("crop_scans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setScans(data);
        setStats({
          total: data.length,
          healthy: data.filter((s) => !s.disease_detected || s.disease_detected === "None").length,
          diseased: data.filter((s) => s.disease_detected && s.disease_detected !== "None").length,
        });
      }
    };

    fetchScans();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium">Total Scans</CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>All time</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-2 border-green-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium">Healthy Crops</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600">{stats.healthy}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4" />
              <span>No disease detected</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-2 border-orange-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium">Diseases Found</CardDescription>
            <CardTitle className="text-3xl font-bold text-orange-600">{stats.diseased}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Needs attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Your latest crop disease analyses</CardDescription>
        </CardHeader>
        <CardContent>
          {scans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Leaf className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No scans yet. Upload your first crop image to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
                  onClick={() => onViewScan(scan.id)}
                >
                  <img
                    src={scan.image_url}
                    alt="Crop"
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{scan.crop_type || "Unknown crop"}</p>
                        <p className="text-sm text-muted-foreground">
                          {scan.disease_detected || "No disease detected"}
                        </p>
                      </div>
                      {scan.severity && (
                        <Badge
                          variant={
                            scan.severity === "low"
                              ? "secondary"
                              : scan.severity === "medium"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {scan.severity}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
