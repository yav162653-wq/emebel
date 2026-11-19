import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUsers } from "../hooks/use-admin";
import { cn } from "@/lib/utils";
import { Shield, User } from "lucide-react";
import { QueryErrorState } from "@/shared/components/QueryErrorState";

export function UsersTab() {
  const { data: users, isLoading, isError, refetch } = useAdminUsers();

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-medium">Users</h1>
        <QueryErrorState onRetry={refetch} className="py-16" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-1">Access</p>
        <h1 className="font-display text-3xl font-medium">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isLoading ? "Loading…" : `${users?.length ?? 0} registered accounts`}
        </p>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-sm border border-border bg-card overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/20">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">ID</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Username</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-6" /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-5 w-14 ml-auto rounded-full" /></td>
                  </tr>
                ))
              : users?.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-secondary/20 transition-colors"
                    data-testid={`user-row-${user.id}`}
                  >
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{user.id}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
                          user.role === "admin"
                            ? "bg-accent/15 text-accent"
                            : "bg-secondary text-muted-foreground"
                        )}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">
                        {user.username ? `@${user.username}` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        user.role === "admin"
                          ? "bg-accent/15 text-accent"
                          : "bg-secondary text-muted-foreground"
                      )}>
                        {user.role === "admin"
                          ? <><Shield className="h-2.5 w-2.5" /> Admin</>
                          : <><User className="h-2.5 w-2.5" /> User</>
                        }
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!isLoading && (!users || users.length === 0) && (
          <div className="py-16 text-center text-muted-foreground text-sm">No users found.</div>
        )}
      </motion.div>
    </div>
  );
}
