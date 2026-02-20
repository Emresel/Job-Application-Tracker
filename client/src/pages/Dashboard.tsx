import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { JobBoard } from "@/components/jobs/JobBoard";
import { Button } from "@/components/ui/button";
import { Plus, Globe, User } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AddJobDialog } from "@/components/jobs/AddJobDialog";
import { useApplications } from "@/hooks/useApplications";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdminOrManagement = user?.role === "Admin" || user?.role === "Management";
  const [showGlobal, setShowGlobal] = useState(isAdminOrManagement);

  const { jobs } = useApplications({ global: showGlobal });
  const interviewCount = jobs.filter((j) => j.status === "Interviewing").length;

  return (
    <Layout>
      <div className="flex flex-col gap-8 h-full">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isAdminOrManagement && showGlobal ? "Organization Dashboard" : "My Dashboard"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {isAdminOrManagement && showGlobal
                ? "Organization-wide overview of job application performance and engagement."
                : `Welcome back! You have ${interviewCount} interview${interviewCount !== 1 ? "s" : ""} coming up this week.`}
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
                <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                  <Plus className="h-4 w-4" />
                  Add Application
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <AddJobDialog />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <StatsOverview global={showGlobal} />

        {/* Recent Activity / Board Preview */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight">Active Applications</h2>
          </div>
          <JobBoard global={showGlobal} />
        </div>
      </div>
    </Layout>
  );
}
