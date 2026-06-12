"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  PROJECT_QUERY,
  REGISTER_ASSETS,
  TRIGGER_PRELABEL,
  PRELABEL_STATUS,
  MODEL_VERSIONS,
  TRAINING_FEEDBACK_STATS,
  BATCH_RERUN_PRELABEL,
  TRIGGER_RETRAINING,
  ACTIVATE_MODEL_VERSION,
} from "@/lib/graphql/operations";
import { uploadAssetWithMeta, downloadExport } from "@/lib/api";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [autolabelEnabled, setAutolabelEnabled] = useState(true);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.85);

  const { data, loading, refetch } = useQuery(PROJECT_QUERY, { variables: { id } });
  const [registerAssets] = useMutation(REGISTER_ASSETS, { onCompleted: () => refetch() });
  const [triggerPrelabel] = useMutation(TRIGGER_PRELABEL);

  const project = data?.project;
  const dataset = project?.datasets?.[0];

  const { data: prelabelData, startPolling, stopPolling } = useQuery(PRELABEL_STATUS, {
    variables: { datasetId: dataset?.id },
    skip: !dataset?.id,
  });

  const { data: modelData, refetch: refetchModels } = useQuery(MODEL_VERSIONS, {
    variables: { projectId: id },
  });
  const { data: feedbackData, refetch: refetchFeedback } = useQuery(TRAINING_FEEDBACK_STATS, {
    variables: { projectId: id },
  });

  const [batchRerun] = useMutation(BATCH_RERUN_PRELABEL);
  const [triggerRetraining, { loading: retraining }] = useMutation(TRIGGER_RETRAINING, {
    onCompleted: () => { refetchModels(); refetchFeedback(); },
  });
  const [activateModel] = useMutation(ACTIVATE_MODEL_VERSION, { onCompleted: () => refetchModels() });

  const prelabelJob = prelabelData?.prelabelStatus;
  const modelVersions = modelData?.modelVersions || [];
  const feedbackStats = feedbackData?.trainingFeedbackStats;

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || !dataset) return;
      setUploading(true);
      setUploadMsg("");
      const assets = [];
      try {
        for (const file of Array.from(files)) {
          const asset = await uploadAssetWithMeta(file);
          assets.push(asset);
        }
        await registerAssets({ variables: { datasetId: dataset.id, assets } });
        setUploadMsg(`Uploaded ${assets.length} file(s) and created tasks.`);
        refetch();
      } catch (err) {
        setUploadMsg(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [dataset, registerAssets, refetch]
  );

  const handlePrelabel = async () => {
    if (!dataset) return;
    await triggerPrelabel({
      variables: {
        input: {
          datasetId: dataset.id,
          autolabelEnabled,
          confidenceThreshold,
          autoSubmit,
        },
      },
    });
    startPolling(2000);
  };

  const handleBatchRerun = async () => {
    if (!dataset) return;
    const activeModel = modelData?.modelVersions?.find((m: { status: string }) => m.status === "active");
    await batchRerun({
      variables: {
        input: {
          datasetId: dataset.id,
          modelVersionId: activeModel?.id,
          autolabelEnabled,
          confidenceThreshold,
          autoSubmit,
        },
      },
    });
    startPolling(2000);
  };

  const handleRetraining = async () => {
    await triggerRetraining({ variables: { projectId: id } });
  };

  if (prelabelJob?.status === "completed" || prelabelJob?.status === "failed") {
    stopPolling();
  }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>;
  if (!project) return <div className="p-8 text-red-400">Project not found</div>;

  const counts = project.taskCounts || {};

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-slate-400">{project.city}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="p-4 bg-card rounded-lg border border-slate-700">
            <p className="text-2xl font-bold">{count as number}</p>
            <p className="text-xs text-slate-400 capitalize">{status.replace("_", " ")}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl border border-slate-700">
          <h2 className="font-semibold mb-4">Upload Assets</h2>
          <p className="text-sm text-slate-400 mb-4">
            Upload images to create labeling tasks automatically.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !dataset}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Select Images"}
          </button>
          {uploadMsg && <p className="text-sm mt-2 text-slate-400">{uploadMsg}</p>}
          {dataset && (
            <p className="text-xs text-slate-500 mt-2">{dataset.assetCount} assets in dataset</p>
          )}
        </div>

        <div className="p-6 bg-card rounded-xl border border-slate-700">
          <h2 className="font-semibold mb-4">ML Pipeline</h2>
          <p className="text-sm text-slate-400 mb-4">
            Run OpenAI vision pre-labeling with autolabeling and active-learning prioritization.
          </p>

          <div className="space-y-3 mb-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autolabelEnabled}
                onChange={(e) => setAutolabelEnabled(e.target.checked)}
              />
              <span>Enable autolabeling (apply high-confidence predictions)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoSubmit}
                onChange={(e) => setAutoSubmit(e.target.checked)}
                disabled={!autolabelEnabled}
              />
              <span>Auto-submit fully autolabeled tasks to review</span>
            </label>
            <div>
              <label className="block text-slate-400 mb-1">
                Confidence threshold: {confidenceThreshold.toFixed(2)}
              </label>
              <input
                type="range"
                min={0.5}
                max={0.99}
                step={0.01}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full"
                disabled={!autolabelEnabled}
              />
            </div>
          </div>

          <button
            onClick={handlePrelabel}
            disabled={!dataset || prelabelJob?.status === "running"}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm disabled:opacity-50"
          >
            Run Pre-label + Autolabel
          </button>
          {prelabelJob && (
            <div className="mt-4 text-sm space-y-1">
              <p className="text-slate-400">
                Status: <span className="text-white capitalize">{prelabelJob.status}</span>
              </p>
              {prelabelJob.status === "running" && (
                <p className="text-slate-400">
                  Progress: {prelabelJob.processedAssets}/{prelabelJob.totalAssets}
                </p>
              )}
              {prelabelJob.status === "completed" && (
                <>
                  <p className="text-emerald-400">
                    Autolabeled: {prelabelJob.autolabeledAssets} assets
                  </p>
                  <p className="text-blue-400">
                    Auto-submitted to review: {prelabelJob.autoSubmittedAssets} tasks
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-card rounded-xl border border-slate-700">
          <h2 className="font-semibold mb-4">Model Versions & Retraining</h2>
          <p className="text-sm text-slate-400 mb-4">
            Manage ML model versions, batch re-run pre-labeling, and trigger retraining from feedback.
          </p>

          {feedbackStats && (
            <div className="grid grid-cols-4 gap-2 mb-4 text-center text-xs">
              <div className="p-2 bg-slate-800 rounded">
                <p className="text-lg font-bold">{feedbackStats.total}</p>
                <p className="text-slate-400">Total Feedback</p>
              </div>
              <div className="p-2 bg-slate-800 rounded">
                <p className="text-lg font-bold text-emerald-400">{feedbackStats.accepts}</p>
                <p className="text-slate-400">Accepts</p>
              </div>
              <div className="p-2 bg-slate-800 rounded">
                <p className="text-lg font-bold text-red-400">{feedbackStats.rejects}</p>
                <p className="text-slate-400">Rejects</p>
              </div>
              <div className="p-2 bg-slate-800 rounded">
                <p className="text-lg font-bold text-amber-400">{feedbackStats.pending}</p>
                <p className="text-slate-400">Pending Training</p>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {modelVersions.map((mv: { id: string; name: string; version: number; status: string; metrics: Record<string, unknown> }) => (
              <div key={mv.id} className="flex items-center justify-between p-2 bg-slate-800 rounded text-sm">
                <div>
                  <span className="font-medium">{mv.name}</span>
                  <span className="text-slate-400 ml-2">v{mv.version}</span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded capitalize ${
                    mv.status === "active" ? "bg-emerald-900 text-emerald-200" :
                    mv.status === "training" ? "bg-amber-900 text-amber-200" : "bg-slate-700 text-slate-300"
                  }`}>{mv.status}</span>
                </div>
                {mv.status !== "active" && (
                  <button
                    onClick={() => activateModel({ variables: { versionId: mv.id } })}
                    className="text-xs px-2 py-1 bg-primary text-white rounded"
                  >
                    Activate
                  </button>
                )}
              </div>
            ))}
            {modelVersions.length === 0 && (
              <p className="text-xs text-slate-500">No model versions yet. Run pre-labeling to create one.</p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleBatchRerun}
              disabled={!dataset || prelabelJob?.status === "running"}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm disabled:opacity-50"
            >
              Batch Re-run (active model)
            </button>
            <button
              onClick={handleRetraining}
              disabled={retraining || (feedbackStats?.pending ?? 0) < 5}
              className="px-4 py-2 bg-violet-700 text-white rounded-lg text-sm disabled:opacity-50"
              title="Requires at least 5 pending feedback samples"
            >
              {retraining ? "Training..." : "Trigger Retraining"}
            </button>
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl border border-slate-700">
          <h2 className="font-semibold mb-4">Label Classes</h2>
          <div className="flex flex-wrap gap-2">
            {project.labelClasses.map((lc: { id: string; name: string; color: string }) => (
              <span
                key={lc.id}
                className="px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: lc.color + "33", color: lc.color }}
              >
                {lc.name}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl border border-slate-700">
          <h2 className="font-semibold mb-4">Export</h2>
          <p className="text-sm text-slate-400 mb-4">Download approved annotations.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadExport(id, "json")}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => downloadExport(id, "coco")}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600"
            >
              Export COCO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
