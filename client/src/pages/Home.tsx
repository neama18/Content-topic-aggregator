import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, Search, Bookmark, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [niche, setNiche] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [, setLocation] = useLocation();

  const { data: searchHistory, isLoading: historyLoading, error: historyError } = trpc.research.getHistory.useQuery({ limit: 5 });

  const startSearchMutation = trpc.research.startSearch.useMutation({
    onSuccess: (data) => {
      setIsSearching(false);
      setKeyword("");
      setNiche("");
      setLocation(`/results/${data.searchId}`);
    },
    onError: (error) => {
      setIsSearching(false);
      console.error("Search error:", error);
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setIsSearching(true);
    startSearchMutation.mutate({
      keyword: keyword.trim(),
      niche: niche.trim() || undefined,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Content Topic Aggregator
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Discover trending content ideas powered by AI. Aggregate insights from Google Trends, Reddit, Quora, TikTok, and more.
          </p>
          <a
            href={`${import.meta.env.VITE_OAUTH_PORTAL_URL}?app_id=${import.meta.env.VITE_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin)}/api/oauth/callback`}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
          >
            Sign In to Get Started
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Content Aggregator</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Welcome, {user?.name || "Creator"}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12 md:py-20">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
              Discover Your Next Big Content Idea
            </h2>
            <p className="text-lg text-muted-foreground">
              Enter a keyword or topic to analyze trending discussions across 8 major platforms and get AI-powered creative briefs.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Keyword or Topic
                </label>
                <Input
                  placeholder="e.g., AI content creation, sustainable fashion..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  disabled={isSearching}
                  className="h-12 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Niche (Optional)
                </label>
                <Input
                  placeholder="e.g., tech, marketing, lifestyle..."
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  disabled={isSearching}
                  className="h-12 text-base"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSearching || !keyword.trim()}
              className="w-full h-12 text-base font-medium"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Trends...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Start Research
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Recent Searches */}
        {!historyError && (
          <div className="max-w-3xl mx-auto mb-16">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Recent Searches</h3>
            </div>
            {historyLoading ? (
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-24 bg-muted rounded-md animate-pulse" />
                ))}
              </div>
            ) : searchHistory && searchHistory.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 5).map((search) => (
                  <Button
                    key={search.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/results/${search.id}`)}
                    className="gap-2"
                  >
                    {search.keyword}
                    {search.niche && <span className="text-xs text-muted-foreground">({search.niche})</span>}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/history")}
                  className="text-accent hover:text-accent"
                >
                  View All →
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <CardTitle className="text-lg">Multi-Source Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Aggregate data from Google Trends, Reddit, Quora, TikTok, Pinterest, BuzzSumo, AnswerThePublic, and AlsoAsked.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-secondary" />
              </div>
              <CardTitle className="text-lg">AI-Powered Briefs</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get structured creative briefs with trend scores, content angles, and recommended formats.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                <Bookmark className="w-5 h-5 text-accent" />
              </div>
              <CardTitle className="text-lg">Save & Organize</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create collections, track search history, and set up trend monitoring for continuous insights.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Content Angles */}
        <div className="max-w-3xl mx-auto mb-16">
          <h3 className="text-2xl font-bold mb-6 text-foreground">Content Angles We Identify</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["Question", "Problem", "Trend", "Seasonal"].map((angle) => (
              <Badge
                key={angle}
                variant="secondary"
                className="px-4 py-2 text-center justify-center h-auto"
              >
                {angle}
              </Badge>
            ))}
          </div>
        </div>

        {/* Suggested Formats */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-foreground">Suggested Content Formats</h3>
          <div className="grid grid-cols-3 gap-3">
            {["Video", "Blog", "Reel"].map((format) => (
              <Card key={format} className="border border-border text-center">
                <CardContent className="pt-6">
                  <p className="font-medium text-foreground">{format}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
