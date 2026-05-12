import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Search, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function SearchHistory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: searches, isLoading } = trpc.research.getHistory.useQuery({
    limit: 50,
  });

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Search History</h1>
          <p className="text-muted-foreground">
            View all your past research sessions
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {!searches || searches.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Search History</h2>
            <p className="text-muted-foreground mb-6">
              Start your first research to see it here.
            </p>
            <Button onClick={() => setLocation("/")} className="gap-2">
              <Search className="w-4 h-4" />
              Start Research
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {searches.map((search) => (
              <Card
                key={search.id}
                className="border border-border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(`/results/${search.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground truncate">
                          {search.keyword}
                        </h3>
                        <Badge
                          variant={search.status === "completed" ? "default" : "secondary"}
                        >
                          {search.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {search.niche && (
                          <div>
                            <span className="text-muted-foreground">Niche: </span>
                            <span className="font-medium text-foreground">{search.niche}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Topics Found: </span>
                          <span className="font-medium text-foreground">{search.resultCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date: </span>
                          <span className="font-medium text-foreground">
                            {new Date(search.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/results/${search.id}`);
                      }}
                    >
                      View Results
                    </Button>
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
