import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Edit2, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TrendMonitoring() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formKeyword, setFormKeyword] = useState("");
  const [formNiche, setFormNiche] = useState("");
  const [formFrequency, setFormFrequency] = useState<"daily" | "weekly" | "biweekly" | "monthly">("weekly");

  const monitoringQuery = trpc.monitoring.list.useQuery();

  const createMutation = trpc.monitoring.create.useMutation({
    onSuccess: () => {
      toast.success("Trend monitoring created successfully");
      setIsCreateDialogOpen(false);
      setFormKeyword("");
      setFormNiche("");
      setFormFrequency("weekly");
      monitoringQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create monitoring");
    },
  });

  const updateMutation = trpc.monitoring.update.useMutation({
    onSuccess: () => {
      toast.success("Monitoring updated successfully");
      setIsEditDialogOpen(false);
      setEditingId(null);
      monitoringQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update monitoring");
    },
  });

  const deleteMutation = trpc.monitoring.delete.useMutation({
    onSuccess: () => {
      toast.success("Monitoring deleted successfully");
      monitoringQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete monitoring");
    },
  });

  const handleCreateMonitoring = () => {
    if (!formKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    createMutation.mutate({
      keyword: formKeyword.trim(),
      niche: formNiche.trim() || undefined,
      frequency: formFrequency,
    });
  };

  const handleEditMonitoring = (monitoring: any) => {
    setEditingId(monitoring.id);
    setFormFrequency(monitoring.frequency);
    setIsEditDialogOpen(true);
  };

  const handleUpdateMonitoring = () => {
    if (!editingId) return;

    updateMutation.mutate({
      monitoringId: editingId,
      frequency: formFrequency,
    });
  };

  const handleDeleteMonitoring = (id: number) => {
    if (confirm("Are you sure you want to delete this monitoring?")) {
      deleteMutation.mutate({ monitoringId: id });
    }
  };

  const frequencyLabels: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Every 2 Weeks",
    monthly: "Monthly",
  };

  const getNextRunDate = (nextRunAt: Date | string | null) => {
    if (!nextRunAt) return "Not scheduled";
    const date = typeof nextRunAt === 'string' ? new Date(nextRunAt) : nextRunAt;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Trend Monitoring</h1>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Monitoring
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Trend Monitoring</DialogTitle>
                <DialogDescription>
                  Set up automatic trend research for a keyword
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Keyword or Topic
                  </label>
                  <Input
                    placeholder="e.g., AI trends, sustainable fashion..."
                    value={formKeyword}
                    onChange={(e) => setFormKeyword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Niche (Optional)
                  </label>
                  <Input
                    placeholder="e.g., tech, marketing, lifestyle..."
                    value={formNiche}
                    onChange={(e) => setFormNiche(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Frequency
                  </label>
                  <Select value={formFrequency} onValueChange={(value: any) => setFormFrequency(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateMonitoring}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {monitoringQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : monitoringQuery.data?.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">
                No trend monitoring set up yet
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Create Your First Monitoring
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {monitoringQuery.data?.map((monitoring) => (
              <Card key={monitoring.id} className="border border-border hover:shadow-md transition-shadow">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-2">
                        {monitoring.keyword}
                      </h3>
                      {monitoring.niche && (
                        <p className="text-sm text-muted-foreground mb-3">
                          Niche: {monitoring.niche}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="secondary">
                          {frequencyLabels[monitoring.frequency]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Next run: {getNextRunDate(monitoring.nextRunAt)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Created {new Date(monitoring.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog open={isEditDialogOpen && editingId === monitoring.id} onOpenChange={(open) => {
                        if (!open) setEditingId(null);
                        setIsEditDialogOpen(open);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMonitoring(monitoring)}
                            className="gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Monitoring</DialogTitle>
                            <DialogDescription>
                              Update monitoring settings for {monitoring.keyword}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Frequency
                              </label>
                              <Select value={formFrequency} onValueChange={(value: any) => setFormFrequency(value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateMonitoring}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  "Update"
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteMonitoring(monitoring.id)}
                        disabled={deleteMutation.isPending}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
