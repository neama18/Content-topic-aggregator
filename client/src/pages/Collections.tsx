import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Folder, ArrowLeft, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function Collections() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [isCreating, setIsCreating] = useState(false);

  const { data: collections, isLoading, refetch } = trpc.collections.list.useQuery();

  const createCollectionMutation = trpc.collections.create.useMutation({
    onSuccess: () => {
      setNewCollectionName("");
      setNewCollectionDescription("");
      setSelectedColor("#6366f1");
      setIsCreating(false);
      refetch();
    },
  });

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    createCollectionMutation.mutate({
      name: newCollectionName.trim(),
      description: newCollectionDescription.trim() || undefined,
      color: selectedColor,
    });
  };

  const colors = [
    "#6366f1", // Indigo
    "#ec4899", // Pink
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#8b5cf6", // Violet
    "#ef4444", // Red
    "#06b6d4", // Cyan
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/monitoring")}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                Trend Monitoring
              </Button>
            </div>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Collection</DialogTitle>
                  <DialogDescription>
                    Organize your favorite topics into collections.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateCollection} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Collection Name
                    </label>
                    <Input
                      placeholder="e.g., AI Marketing Ideas"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description (Optional)
                    </label>
                    <Input
                      placeholder="Add a description..."
                      value={newCollectionDescription}
                      onChange={(e) => setNewCollectionDescription(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded-full transition-transform ${
                            selectedColor === color ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Create Collection
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Collections</h1>
          <p className="text-muted-foreground">
            Organize and manage your saved topics
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {!collections || collections.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <Folder className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Collections Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first collection to organize topics.
            </p>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Collection</DialogTitle>
                  <DialogDescription>
                    Organize your favorite topics into collections.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateCollection} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Collection Name
                    </label>
                    <Input
                      placeholder="e.g., AI Marketing Ideas"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description (Optional)
                    </label>
                    <Input
                      placeholder="Add a description..."
                      value={newCollectionDescription}
                      onChange={(e) => setNewCollectionDescription(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded-full transition-transform ${
                            selectedColor === color ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Create Collection
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="border border-border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(`/collection/${collection.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: collection.color || "#6366f1" }}
                        />
                        <CardTitle className="text-lg truncate">
                          {collection.name}
                        </CardTitle>
                      </div>
                      {collection.description && (
                        <CardDescription className="line-clamp-2">
                          {collection.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(collection.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
