import { useState } from "react";
import { useApplications } from "@/hooks/useApplications";
import type { JobStatus } from "@/lib/store";
import { JobCard } from "./JobCard";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const COLUMNS: JobStatus[] = ["Applied", "Interviewing", "Offer", "Rejected"];

export function JobBoard() {
  const { jobs, isLoading, updateJobStatus } = useApplications();
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full place-items-center">
        <p className="text-muted-foreground col-span-full">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full overflow-x-auto pb-4">
      {COLUMNS.map((status) => {
        const columnJobs = jobs.filter((job) => job.status === status);
        
        return (
          <div key={status} className="flex flex-col h-full min-w-[280px]">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  {status}
                </h3>
                <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                  {columnJobs.length}
                </span>
              </div>
              <button className="text-muted-foreground hover:text-primary transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 bg-muted/30 rounded-xl border border-dashed border-border/60 p-3">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {columnJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </AnimatePresence>
                {columnJobs.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-muted-foreground/40 text-sm italic">
                    No applications
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
