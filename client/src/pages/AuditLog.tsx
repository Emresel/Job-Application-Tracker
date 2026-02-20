import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation } from "wouter";

interface AuditLogEntry {
    logID: number;
    action: string;
    timestamp: string;
    userName?: string;
    userEmail?: string;
}

export default function AuditLog() {
    const { user, token } = useAuth();
    const [_, setLocation] = useLocation();

    if (user?.role !== "Admin") {
        setLocation("/");
        return null;
    }

    const { data: logs, isLoading } = useQuery<AuditLogEntry[]>({
        queryKey: ["audit-log"],
        queryFn: async () => {
            const res = await fetch("/api/v1/audit", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch audit logs");
            return res.json();
        },
        enabled: !!token && user?.role === "Admin",
    });

    return (
        <Layout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
                    <p className="text-muted-foreground mt-1">
                        System administration history and user activities.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Showing the latest logged actions in the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-4 text-muted-foreground">Loading logs...</div>
                        ) : !logs || logs.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">No audit logs found.</div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log) => (
                                            <TableRow key={log.logID}>
                                                <TableCell className="whitespace-nowrap">
                                                    {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                                                </TableCell>
                                                <TableCell>{log.userName || "Unknown"}</TableCell>
                                                <TableCell className="text-muted-foreground">{log.userEmail || "-"}</TableCell>
                                                <TableCell className="font-mono text-xs">{log.action}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
