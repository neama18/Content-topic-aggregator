import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Results from "@/pages/Results";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import SearchHistory from "@/pages/SearchHistory";
import TrendMonitoring from "@/pages/TrendMonitoring";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/results/:searchId"} component={Results} />
      <Route path={"/collections"} component={Collections} />
      <Route path={"/collection/:collectionId"} component={CollectionDetail} />
      <Route path={"/monitoring"} component={TrendMonitoring} />
      <Route path={"/history"} component={SearchHistory} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
