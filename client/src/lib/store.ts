import { create } from "zustand";

export type JobStatus = "Applied" | "Interviewing" | "Offer" | "Rejected";

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  type: "Remote" | "On-site" | "Hybrid";
  status: JobStatus;
  appliedDate: string;
  deadline?: string;
  salaryRange?: string;
  notes?: string;
  logo?: string;
}

interface JobStore {
  jobs: JobApplication[];
  addJob: (job: Omit<JobApplication, "id">) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  deleteJob: (id: string) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  jobs: [
    {
      id: "1",
      company: "TechFlow",
      position: "Senior Frontend Engineer",
      location: "San Francisco, CA",
      type: "Hybrid",
      status: "Interviewing",
      appliedDate: "2024-02-15",
      salaryRange: "$160k - $190k",
      logo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=128&h=128&fit=crop&auto=format"
    },
    {
      id: "2",
      company: "Nebula AI",
      position: "Product Designer",
      location: "Remote",
      type: "Remote",
      status: "Applied",
      appliedDate: "2024-02-18",
      salaryRange: "$140k - $160k",
      logo: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=128&h=128&fit=crop&auto=format"
    },
    {
      id: "3",
      company: "GreenLeaf",
      position: "Full Stack Developer",
      location: "Austin, TX",
      type: "On-site",
      status: "Rejected",
      appliedDate: "2024-01-20",
      salaryRange: "$130k - $150k",
      logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&h=128&fit=crop&auto=format"
    },
    {
      id: "4",
      company: "Quantum Fin",
      position: "React Native Engineer",
      location: "New York, NY",
      type: "Hybrid",
      status: "Offer",
      appliedDate: "2024-02-01",
      salaryRange: "$180k - $220k",
      logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop&auto=format"
    },
     {
      id: "5",
      company: "Stark Industries",
      position: "Chief Engineer",
      location: "Malibu, CA",
      type: "On-site",
      status: "Applied",
      appliedDate: "2024-02-20",
      salaryRange: "$500k+",
      logo: "https://images.unsplash.com/photo-1568952433726-3896e3881c65?w=128&h=128&fit=crop&auto=format"
    }
  ],
  addJob: (job) =>
    set((state) => ({
      jobs: [
        ...state.jobs,
        { ...job, id: Math.random().toString(36).substring(7), logo: `https://avatar.vercel.sh/${job.company}` },
      ],
    })),
  updateJobStatus: (id, status) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, status } : job
      ),
    })),
  deleteJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
    })),
}));
