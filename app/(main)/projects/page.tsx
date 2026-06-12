"use client";

import { useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useState } from "react";
import { CREATE_PROJECT, PROJECTS_QUERY } from "@/lib/graphql/operations";

export default function ProjectsPage() {
  const { data, loading, refetch } = useQuery(PROJECTS_QUERY);
  const [createProject] = useMutation(CREATE_PROJECT, { onCompleted: () => refetch() });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    description: "",
    classes: [
      { name: "Pedestrian", color: "#ef4444" },
      { name: "Vehicle", color: "#3b82f6" },
      { name: "Cyclist", color: "#22c55e" },
    ],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject({
      variables: {
        input: {
          name: form.name,
          city: form.city,
          description: form.description,
          labelClasses: form.classes,
        },
      },
    });
    setShowForm(false);
    setForm({ name: "", city: "", description: "", classes: form.classes });
  };

  if (loading) return <div className="p-8 text-slate-400">Loading projects...</div>;

  const projects = data?.projects || [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-slate-400 text-sm">Manage labeling projects and datasets</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600"
        >
          + New Project
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-6 bg-card rounded-xl border border-slate-700 space-y-4">
          <h2 className="font-semibold">Create Project</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Project name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"
              required
            />
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"
              required
            />
          </div>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"
            rows={2}
          />
          <div className="flex gap-2">
            {form.classes.map((c, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: c.color + "33", color: c.color }}>
                {c.name}
              </span>
            ))}
          </div>
          <button type="submit" className="px-4 py-2 bg-accent text-white rounded-lg text-sm">
            Create
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {projects.map((p: {
          id: string;
          name: string;
          city: string;
          description?: string;
          taskCounts: Record<string, number>;
          datasets: { assetCount: number }[];
        }) => {
          const total = Object.values(p.taskCounts).reduce((a: number, b: number) => a + b, 0);
          const approved = p.taskCounts.approved || 0;
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block p-6 bg-card rounded-xl border border-slate-700 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  <p className="text-slate-400 text-sm">{p.city}</p>
                  {p.description && <p className="text-slate-500 text-sm mt-1">{p.description}</p>}
                </div>
                <div className="text-right text-sm">
                  <p className="text-slate-400">{total} tasks</p>
                  <p className="text-accent">{approved} approved</p>
                </div>
              </div>
              <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: total ? `${(approved / total) * 100}%` : "0%" }}
                />
              </div>
            </Link>
          );
        })}
        {projects.length === 0 && (
          <p className="text-slate-500 text-center py-12">No projects yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
