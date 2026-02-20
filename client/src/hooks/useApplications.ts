import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { JobApplication, JobStatus } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";

// Backend application row
export interface BackendApp {
  appID: number;
  userID: number;
  categoryID: number | null;
  companyID: number | null;
  company: string;
  position: string;
  status: string;
  priority: number;
  appliedDate: string;
  deadline: string | null;
  notes: string | null;
  categoryName?: string | null;
  companyName?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

export interface ApplicationsResponse {
  page: number;
  pageSize: number;
  total: number;
  items: BackendApp[];
}

const BACKEND_TO_FRONTEND_STATUS: Record<string, JobStatus> = {
  Applied: "Applied",
  Interview: "Interviewing",
  Offer: "Offer",
  Accepted: "Offer",
  Rejected: "Rejected",
  Rejection: "Rejected",
};

const FRONTEND_TO_BACKEND_STATUS: Record<JobStatus, string> = {
  Applied: "Applied",
  Interviewing: "Interview",
  Offer: "Offer",
  Rejected: "Rejected",
};

export function backendStatusToFrontend(status: string): JobStatus {
  return BACKEND_TO_FRONTEND_STATUS[status] ?? "Applied";
}

export function frontendStatusToBackend(status: JobStatus): string {
  return FRONTEND_TO_BACKEND_STATUS[status] ?? status;
}

function mapBackendToJob(b: BackendApp): JobApplication {
  return {
    id: String(b.appID),
    company: b.company,
    position: b.position,
    location: "", // backend has no location; could put in notes
    type: "Remote",
    status: backendStatusToFrontend(b.status),
    appliedDate: b.appliedDate,
    deadline: b.deadline ?? undefined,
    notes: b.notes ?? undefined,
    logo: undefined,
    userName: b.userName ?? undefined,
  };
}

const APPLICATIONS_QUERY_KEY = ["applications"] as const;

export function useApplications(options: { global?: boolean } = {}) {
  const queryClient = useQueryClient();
  const { global = false } = options;

  const { user } = useAuth();
  const isAdminOrManagement = user?.role === "Admin" || user?.role === "Management";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...APPLICATIONS_QUERY_KEY, global],
    queryFn: async (): Promise<JobApplication[]> => {
      const queryParams = new URLSearchParams({
        page: "1",
        pageSize: "500",
        sort: "-appliedDate",
      });
      if (isAdminOrManagement && global) {
        queryParams.append("global", "true");
      }
      const res = await apiGet<ApplicationsResponse>(
        `/applications?${queryParams.toString()}`
      );
      return (res?.items ?? []).map(mapBackendToJob);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (job: Omit<JobApplication, "id">) => {
      const res = await apiPost<{ appID: number }>("/applications", {
        company: job.company,
        position: job.position,
        status: frontendStatusToBackend(job.status),
        appliedDate: job.appliedDate,
        deadline: job.deadline || null,
        notes: job.notes ?? null,
      });
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: JobStatus }) => {
      await apiPut(`/applications/${id}`, { status: frontendStatusToBackend(status) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`/applications/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY }),
  });

  return {
    jobs: data ?? [],
    isLoading,
    error,
    refetch,
    addJob: addMutation.mutateAsync,
    updateJobStatus: (id: string, status: JobStatus) =>
      updateStatusMutation.mutateAsync({ id, status }),
    deleteJob: deleteMutation.mutateAsync,
    addPending: addMutation.isPending,
    updatePending: updateStatusMutation.isPending,
    deletePending: deleteMutation.isPending,
  };
}
