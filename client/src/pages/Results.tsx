import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Download, Copy, Bookmark, ChevronRight, Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Results() {
  const { user } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  const searchId = parseInt(params?.searchId || "0");
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"trend" | "angle" | "title">("trend");
  const [filterAngle, setFilterAngle] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [minTrendScore, setMinTrendScore] = useState(0);

  const { data: results, isLoading } = trpc.research.getResults.useQuery(
    { searchId },
    { enabled: !!searchId }
  );

  const { data: collections } = trpc.collections.list.useQuery();

  const addToCollectionMutation = trpc.collections.addTopic.useMutation({
    onSuccess: () => {
      setShowCollectionDialog(false);
    },
  });

  const exportCSVMutation = trpc.export.toCSV.useQuery(
    { searchId },
    { enabled: false }
  );

  const handleExportCSV = async () => {
    const result = await exportCSVMutation.refetch();
    if (result.data?.csv) {
      const blob = new Blob([result.data.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleCopyToClipboard = () => {
    if (results?.topics) {
      const text = results.topics
        .map(
          (t) =>
            `${t.title}\nAngle: ${t.contentAngle}\nScore: ${t.trendScore}\nSources: ${t.sources.join(", ")}\nFormats: ${t.suggestedFormats.join(", ")}\n`
        )
        .join("\n---\n");
      navigator.clipboard.writeText(text);
    }
  };

  const selectedTopicData = results?.topics.find((t) => t.id === selectedTopic);

  // Filtering and sorting logic
  const filteredAndSortedTopics = results?.topics
    .filter((topic) => {
      if (filterAngle && topic.contentAngle !== filterAngle) return false;
      if (filterSource && !topic.sources.includes(filterSource)) return false;
      const score = typeof topic.trendScore === 'string' ? parseFloat(topic.trendScore) : topic.trendScore;
      if (score < minTrendScore) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "trend") {
        return (typeof b.trendScore === 'string' ? parseFloat(b.trendScore) : b.trendScore) - 
               (typeof a.trendScore === 'string' ? parseFloat(a.trendScore) : a.trendScore);
      } else if (sortBy === "angle") {
        return a.contentAngle.localeCompare(b.contentAngle);
      } else {
        return a.title.localeCompare(b.title);
      }
    }) || [];

  const uniqueAngles = results?.topics
    .map((t) => t.contentAngle)
    .filter((v, i, a) => a.indexOf(v) === i) || [];

  const uniqueSources = results?.topics
    .flatMap((t) => t.sources)
    .filter((v, i, a) => a.indexOf(v) === i) || [];

  const hasActiveFilters = filterAngle || filterSource || minTrendScore > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Search not found</p>
          <Button onClick={() => setLocation("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters {hasActiveFilters && `(${filterAngle ? 1 : 0}${filterSource ? 1 : 0}${minTrendScore > 0 ? 1 : 0})`}
              </Button>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Research Results
            </h1>
            <p className="text-muted-foreground">
              Keyword: <span className="font-medium text-foreground">{results.search.keyword}</span>
              {results.search.niche && (
                <>
                  {" "} • Niche: <span className="font-medium text-foreground">{results.search.niche}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-b border-border bg-background/50 backdrop-blur-sm">
          <div className="container py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Filters & Sorting</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trend">Trend Score (High to Low)</SelectItem>
                    <SelectItem value="angle">Content Angle</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Content Angle</label>
                <Select value={filterAngle || ""} onValueChange={(value) => setFilterAngle(value || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All angles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All angles</SelectItem>
                    {uniqueAngles.map((angle) => (
                      <SelectItem key={angle} value={angle}>
                        {angle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Source</label>
                <Select value={filterSource || ""} onValueChange={(value) => setFilterSource(value || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sources</SelectItem>
                    {uniqueSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Min Trend Score</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minTrendScore}
                  onChange={(e) => setMinTrendScore(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">{minTrendScore}/100</p>
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterAngle(null);
                  setFilterSource(null);
                  setMinTrendScore(0);
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container py-12">
        {filteredAndSortedTopics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No topics found for this search.</p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Try Another Search
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedTopics.map((topic) => (
              <Card
                key={topic.id}
                className="border border-border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTopic(topic.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground truncate">
                          {topic.title}
                        </h3>
                        <Badge variant="secondary" className="whitespace-nowrap">
                          {topic.contentAngle}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {topic.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {topic.sources.map((source: string) => (
                          <Badge key={source} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Trend Score: </span>
                          <span className="font-semibold text-accent">
                            {(typeof topic.trendScore === 'string' ? parseFloat(topic.trendScore) : topic.trendScore).toFixed(1)}/100
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Formats: </span>
                          <span className="font-medium text-foreground">
                            {topic.suggestedFormats.join(", ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCollectionDialog(true);
                          setSelectedTopic(topic.id);
                        }}
                        className="gap-2"
                      >
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Topic Detail Dialog */}
      {selectedTopicData && (
        <Dialog open={!!selectedTopic} onOpenChange={() => setSelectedTopic(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedTopicData.title}</DialogTitle>
              <DialogDescription className="text-base">
                {selectedTopicData.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Why Trending */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Why This is Trending</h4>
                <p className="text-sm text-muted-foreground">{selectedTopicData.whyTrending}</p>
              </div>

              {/* Example Questions */}
              {selectedTopicData.exampleQuestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Example Questions</h4>
                  <ul className="space-y-2">
                    {selectedTopicData.exampleQuestions.map((q: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-accent">•</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Keywords */}
              {selectedTopicData.relatedKeywords.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Related Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopicData.relatedKeywords.map((k: string) => (
                      <Badge key={k} variant="secondary">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Content Angle</p>
                  <Badge>{selectedTopicData.contentAngle}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Trend Score</p>
                  <p className="font-semibold text-accent">
                    {(typeof selectedTopicData.trendScore === 'string' ? parseFloat(selectedTopicData.trendScore) : selectedTopicData.trendScore).toFixed(1)}/100
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sources</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedTopicData.sources.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Suggested Formats</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedTopicData.suggestedFormats.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Collection Dialog */}
      {showCollectionDialog && (
        <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save to Collection</DialogTitle>
              <DialogDescription>
                Choose a collection to save this topic to.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {collections && collections.length > 0 ? (
                collections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      if (selectedTopic) {
                        addToCollectionMutation.mutate({
                          collectionId: collection.id,
                          topicId: selectedTopic,
                        });
                      }
                    }}
                  >
                    {collection.name}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No collections yet.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
