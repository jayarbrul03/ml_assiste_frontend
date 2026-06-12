"use client";

import { useQuery } from "@apollo/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { DASHBOARD_SUMMARY, PROJECTS_QUERY } from "@/lib/graphql/operations";
import { useState } from "react";

export default function DashboardPage() {
  const [projectId, setProjectId] = useState<string | undefined>();
  const { data: projectsData } = useQuery(PROJECTS_QUERY);
  const { data, loading } = useQuery(DASHBOARD_SUMMARY, {
    variables: { projectId: projectId || null },
  });

  if (loading) return <div className="p-8 text-slate-400">Loading dashboard...</div>;

  const summary = data?.dashboardSummary;
  if (!summary) return null;

  const statusData = Object.entries(summary.tasksByStatus).map(([status, count]) => ({
    status: status.replace("_", " "),
    count,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-slate-400 text-sm">Labeling efficiency and quality metrics</p>
        </div>
        <select
          value={projectId || ""}
          onChange={(e) => setProjectId(e.target.value || undefined)}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
        >
          <option value="">All Projects</option>
          {projectsData?.projects?.map((p: { id: string; name: string }) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <MetricCard label="Total Tasks" value={summary.totalTasks} />
        <MetricCard label="Approved" value={summary.approvedTasks} color="text-accent" />
        <MetricCard label="Autolabeled" value={summary.autolabeledTasks} color="text-violet-400" />
        <MetricCard label="Uncertain (needs review)" value={summary.uncertainTasks} color="text-amber-400" />
        <MetricCard label="Review Pass Rate" value={`${summary.reviewPassRate}%`} />
        <MetricCard label="Pre-label Acceptance" value={`${summary.prelabelAcceptanceRate}%`} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-card rounded-xl border border-slate-700">
          <h2 className="font-semibold mb-4">Tasks by Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <XAxis dataKey="status" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "none" }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 bg-card rounded-xl border border-slate-700">
          <h2 className="font-semibold mb-4">Labeler Throughput (7 days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={summary.throughputByDay}>
              <CartesianGrid stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "none" }} />
              <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl border border-slate-700">
        <h2 className="font-semibold mb-4">Project Progress</h2>
        <div className="space-y-4">
          {summary.projectProgress.map((p: { project_id: string; project_name: string; approved: number; total: number; percent: number }) => (
            <div key={p.project_id}>
              <div className="flex justify-between text-sm mb-1">
                <span>{p.project_name}</span>
                <span className="text-slate-400">{p.approved}/{p.total} ({p.percent}%)</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${p.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="p-4 bg-card rounded-xl border border-slate-700">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}
