import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LayoutDashboard, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md">
        <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center animate-pulse">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
          <h2 className="text-2xl font-semibold">Page not found</h2>
          <p className="text-muted-foreground">
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>

        <Link href="/">
          <Button className="gap-2" size="lg">
            <LayoutDashboard className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
