import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public pages
import Home from "./pages/Home";
import About from "./pages/About";
import Members from "./pages/Members";
import MemberDetail from "./pages/MemberDetail";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Contact from "./pages/Contact";
import Login from "./pages/Login";

// Private dashboard pages
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/dashboard/Profile";
import Messages from "./pages/dashboard/Messages";
import Meetings from "./pages/dashboard/Meetings";
import Congresses from "./pages/dashboard/Congresses";
import Papers from "./pages/dashboard/Papers";
import Events from "./pages/dashboard/Events";
import Documents from "./pages/dashboard/Documents";
import Tasks from "./pages/dashboard/Tasks";
import Notifications from "./pages/dashboard/Notifications";
import Assistant from "./pages/dashboard/Assistant";
import Calendar from "./pages/dashboard/Calendar";

// Admin pages
import AdminUsers from "./pages/dashboard/admin/AdminUsers";
import AdminNews from "./pages/dashboard/admin/AdminNews";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/members" component={Members} />
      <Route path="/members/:id" component={MemberDetail} />
      <Route path="/news" component={News} />
      <Route path="/news/:slug" component={NewsDetail} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={Login} />

      {/* Private dashboard */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/profile" component={Profile} />
      <Route path="/dashboard/messages" component={Messages} />
      <Route path="/dashboard/meetings" component={Meetings} />
      <Route path="/dashboard/congresses" component={Congresses} />
      <Route path="/dashboard/papers" component={Papers} />
      <Route path="/dashboard/events" component={Events} />
      <Route path="/dashboard/documents" component={Documents} />
      <Route path="/dashboard/tasks" component={Tasks} />
      <Route path="/dashboard/notifications" component={Notifications} />
      <Route path="/dashboard/assistant" component={Assistant} />
      <Route path="/dashboard/calendar" component={Calendar} />

      {/* Admin */}
      <Route path="/dashboard/admin/users" component={AdminUsers} />
      <Route path="/dashboard/admin/news" component={AdminNews} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
