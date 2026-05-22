import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  FileText,
  FlaskConical,
  Globe,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  Megaphone,
  PanelLeft,
  Settings,
  Sparkles,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

const mainNav = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Bell, label: "Notifications", path: "/dashboard/notifications" },
  { icon: Calendar, label: "Calendar", path: "/dashboard/calendar" },
];

const collaborationNav = [
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
  { icon: Megaphone, label: "Announcements", path: "/dashboard/announcements" },
  { icon: CalendarDays, label: "Meetings", path: "/dashboard/meetings" },
  { icon: Trophy, label: "Conferences", path: "/dashboard/congresses" },
  { icon: BookOpen, label: "Papers", path: "/dashboard/papers" },
  { icon: Globe, label: "Events", path: "/dashboard/events" },
];

const resourcesNav = [
  { icon: FileText, label: "Documents", path: "/dashboard/documents" },
  { icon: KanbanSquare, label: "Tasks", path: "/dashboard/tasks" },
  { icon: Sparkles, label: "AI Assistant", path: "/dashboard/assistant" },
];

const adminNav = [
  { icon: Users, label: "Users", path: "/dashboard/admin/users" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full glass-card rounded-2xl bracket-accent">
          <img src="/manus-storage/logo-transparent_b00932e3.png" alt="AI&Tech4Human" className="w-16 h-16 object-contain" />
          <div className="text-center">
            <h1 className="font-serif text-2xl font-semibold text-foreground">Member Area</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Access is restricted to group members. Please sign in to continue.
            </p>
          </div>
          <Link href="/login">
            <Button size="lg" className="w-full font-medium">Sign In</Button>
          </Link>
          <Link href="/">
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">← Back to public site</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout, isAdmin } = useAuth();
  const [location, navigate] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const { data: profile } = trpc.profiles.getMyProfile.useQuery();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - left;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const NavGroup = ({ items, label }: { items: typeof mainNav; label?: string }) => (
    <SidebarGroup>
      {label && !isCollapsed && <SidebarGroupLabel className="text-xs text-muted-foreground/60 uppercase tracking-wider px-2">{label}</SidebarGroupLabel>}
      <SidebarMenu className="px-2 py-0.5">
        {items.map((item) => {
          const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
          return (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                isActive={isActive}
                onClick={() => navigate(item.path)}
                tooltip={item.label}
                className="h-9 font-normal"
              >
                <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                <span>{item.label}</span>
                {item.label === "Notifications" && unreadCount && unreadCount > 0 && (
                  <Badge className="ml-auto h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground">{unreadCount}</Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar/80 backdrop-blur-sm" disableTransition={isResizing}>
          <SidebarHeader className="h-14 justify-center border-b border-border/50">
            <div className="flex items-center gap-2.5 px-2">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors shrink-0"
              >
                {isCollapsed ? (
                  <img src="/manus-storage/logo-transparent_b00932e3.png" alt="logo" className="h-6 w-6 object-contain" />
                ) : (
                  <PanelLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {!isCollapsed && (
                <div className="flex items-center min-w-0">
                  <img
                    src="/manus-storage/logo-transparent_b00932e3.png"
                    alt="AI&Tech4Human"
                    className="h-7 w-auto object-contain"
                  />
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <NavGroup items={mainNav} />
            <NavGroup items={collaborationNav} label="Collaboration" />
            <NavGroup items={resourcesNav} label="Resources" />
            {isAdmin && <NavGroup items={adminNav} label="Administration" />}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 shrink-0">
                    {profile?.photoUrl && <AvatarImage src={profile.photoUrl} />}
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-none">{user?.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-1 capitalize">{user?.role}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { window.open("/", "_blank"); }} className="cursor-pointer">
                  <Globe className="mr-2 h-4 w-4" /> Public Site
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8 rounded-lg" />
              <span className="font-serif text-sm font-semibold text-foreground">AI&Tech4Human</span>
            </div>
            {unreadCount && unreadCount > 0 ? (
              <Badge className="h-5 px-2 text-xs bg-primary">{unreadCount}</Badge>
            ) : null}
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
