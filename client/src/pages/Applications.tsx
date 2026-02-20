import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { JobBoard } from "@/components/jobs/JobBoard";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Globe, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AddJobDialog } from "@/components/jobs/AddJobDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Applications() {
  const { user } = useAuth();
  const isAdminOrManagement = user?.role === "Admin" || user?.role === "Management";
  const [showGlobal, setShowGlobal] = useState(isAdminOrManagement);

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isAdminOrManagement && showGlobal ? "Organization Applications" : "My Applications"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdminOrManagement && showGlobal
                ? "Manage and track job applications across the entire organization."
                : "Manage and track all your job applications in one place."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isAdminOrManagement && (
              <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                <Label htmlFor="global-toggle" className="text-xs font-medium cursor-pointer flex items-center gap-2">
                  {showGlobal ? <Globe className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {showGlobal ? "All Jobs" : "My Jobs"}
                </Label>
                <Switch
                  id="global-toggle"
                  checked={showGlobal}
                  onCheckedChange={setShowGlobal}
                />
              </div>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Application
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <AddJobDialog />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-card p-2 rounded-lg border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies, roles..."
              className="pl-9 border-none bg-transparent focus-visible:ring-0 shadow-none"
            />
          </div>
          <div className="h-6 w-px bg-border" />
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Board */}
        <div className="flex-1 min-h-0">
          <JobBoard global={showGlobal} />
        </div>
      </div>
    </Layout>
  );
}
