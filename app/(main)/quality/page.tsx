"use client";

import { useQuery } from "@apollo/client";
import { useState } from "react";
import { LABELER_QUALITY, SLA_SUMMARY, PROJECTS_QUERY } from "@/lib/graphql/operations";

export default function QualityPage() {
  const [projectId, setProjectId] = useState<string | undefined>();
  const { data: projectsData } = useQuery(PROJECTS_QUERY);
  const { data: qualityData, loading: qLoading } = useQuery(LABELER_QUALITY, {
    variables: { projectId: projectId || null },
  });
  const { data: slaData, loading: sLoading } = useQuery(SLA_SUMMARY, {
    variables: { projectId: projectId || null },
  });

  if (qLoading || sLoading) return <div className="p-8 text-slate-400">Loading quality metrics...</div>;

  const labelers = qualityData?.labelerQuality || [];
  const sla = slaData?.slaSummary;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Quality & SLA</h1>
          <p className="text-slate-400 text-sm">Per-labeler quality scoring and SLA tracking</p>
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

      {sla && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <MetricCard label="SLA Tracked" value={sla.totalTracked} />
          <MetricCard label="On Track" value={sla.onTrack} color="text-emerald-400" />
          <MetricCard label="At Risk" value={sla.atRisk} color="text-amber-400" />
          <MetricCard label="Overdue" value={sla.overdue} color="text-red-400" />
        </div>
      )}

      <div className="p-6 bg-card rounded-xl border border-slate-700">
        <h2 className="font-semibold mb-4">Labeler Quality Scores</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2">Labeler</th>
                <th className="text-right py-2">Quality</th>
                <th className="text-right py-2">Approval %</th>
                <th className="text-right py-2">Avg QA</th>
                <th className="text-right py-2">SLA %</th>
                <th className="text-right py-2">Completed</th>
                <th className="text-right py-2">Avg Turnaround</th>
              </tr>
            </thead>
            <tbody>
              {labelers.map((l: {
                labelerId: string; labelerName: string; qualityScore: number;
                approvalRate: number; avgQaScore?: number | null;
                slaComplianceRate: number; tasksCompleted: number;
                avgTurnaroundHours?: number | null;
              }) => (
                <tr key={l.labelerId} className="border-b border-slate-800">
                  <td className="py-3">{l.labelerName}</td>
                  <td className="text-right">
                    <span className={`font-bold ${l.qualityScore >= 80 ? "text-emerald-400" : l.qualityScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
                      {l.qualityScore}
                    </span>
                  </td>
                  <td className="text-right text-slate-300">{l.approvalRate}%</td>
                  <td className="text-right text-slate-300">
                    {l.avgQaScore != null ? (l.avgQaScore * 100).toFixed(0) + "%" : "—"}
                  </td>
                  <td className="text-right text-slate-300">{l.slaComplianceRate}%</td>
                  <td className="text-right text-slate-300">{l.tasksCompleted}</td>
                  <td className="text-right text-slate-300">
                    {l.avgTurnaroundHours != null ? `${l.avgTurnaroundHours}h` : "—"}
                  </td>
                </tr>
              ))}
              {labelers.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">No labeler data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color = "text-white" }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-4 bg-card rounded-xl border border-slate-700">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}
