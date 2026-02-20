import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Briefcase, Calendar, Settings, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/applications", label: "Applications", icon: Briefcase },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  if (user?.role === "Admin") {
    links.splice(links.length - 1, 0, { href: "/audit", label: "Audit Log", icon: Shield });
  }

  return (
    <div className="h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight text-sidebar-foreground">JobTrack</span>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-sidebar-border">
        {user && (
          <p className="px-3 py-1 text-xs text-muted-foreground truncate" title={user.email}>
            {user.email}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem("guestMode");
            logout();
          }}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-sidebar-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="pl-64 min-h-screen">
        <div className="container mx-auto max-w-7xl p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
