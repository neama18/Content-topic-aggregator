import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Trash2, Edit2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CollectionDetail() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("");

  const collectionQuery = trpc.collections.getWithItems.useQuery(
    { collectionId: parseInt(collectionId || "0") },
    { enabled: !!collectionId }
  );

  const updateMutation = trpc.collections.update.useMutation({
    onSuccess: () => {
      toast.success("Collection updated successfully");
      setIsEditDialogOpen(false);
      collectionQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update collection");
    },
  });

  const deleteMutation = trpc.collections.delete.useMutation({
    onSuccess: () => {
      toast.success("Collection deleted successfully");
      setLocation("/collections");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete collection");
    },
  });

  const removeTopicMutation = trpc.collections.removeTopic.useMutation({
    onSuccess: () => {
      toast.success("Topic removed from collection");
      collectionQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove topic");
    },
  });

  if (collectionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!collectionQuery.data?.collection) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Collection Not Found</h1>
          <Button onClick={() => setLocation("/collections")}>Back to Collections</Button>
        </div>
      </div>
    );
  }

  const { collection, items } = collectionQuery.data;
  const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33F5", "#F5FF33", "#FF8C33", "#33FFF5", "#8C33FF"];

  const handleEditClick = () => {
    setEditName(collection.name);
    setEditDescription(collection.description || "");
    setEditColor(collection.color || "#FF5733");
    setIsEditDialogOpen(true);
  };

  const handleUpdateCollection = () => {
    updateMutation.mutate({
      collectionId: collection.id,
      name: editName || undefined,
      description: editDescription || undefined,
      color: editColor || undefined,
    });
  };

  const handleDeleteCollection = () => {
    if (confirm("Are you sure you want to delete this collection? This action cannot be undone.")) {
      deleteMutation.mutate({ collectionId: collection.id });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/collections")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div
              className="w-6 h-6 rounded"
              style={{ backgroundColor: collection.color || "#FF5733" }}
            />
            <h1 className="text-xl font-bold text-foreground">{collection.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Collection</DialogTitle>
                  <DialogDescription>Update your collection details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Collection Name
                    </label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Collection name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description (Optional)
                    </label>
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Collection description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Color
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          className={`w-full h-10 rounded border-2 transition-all ${
                            editColor === color
                              ? "border-foreground"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateCollection}
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
              onClick={handleDeleteCollection}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Collection Info */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground mb-2">
                {collection.description || "No description"}
              </p>
              <p className="text-sm text-muted-foreground">
                Created {new Date(collection.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="secondary">{items.length} topics</Badge>
          </div>
        </div>

        {/* Topics List */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Topics in Collection</h2>

          {items.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground mb-4">No topics in this collection yet</p>
                <Button onClick={() => setLocation("/")}>Start a Search</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="border border-border hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Topic ID: {item.topicId}</p>
                        <p className="text-sm text-muted-foreground">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeTopicMutation.mutate({
                            collectionId: collection.id,
                            topicId: item.topicId,
                          })
                        }
                        disabled={removeTopicMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
