import { authHeaders, clearAuthToken, setAuthToken } from "./auth-token";
import { API_URL } from "./types";

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }
  const data = await res.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function logout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  }).catch(() => undefined);
  clearAuthToken();
}

export async function getMe() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function uploadAsset(file: File): Promise<{
  storage_key: string;
  public_url: string;
  mime_type: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/upload/file`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return {
    storage_key: data.storage_key,
    public_url: data.public_url,
    mime_type: data.mime_type,
  };
}

export async function downloadExport(projectId: string, format: "json" | "coco") {
  const res = await fetch(`${API_URL}/export/${projectId}?format=${format}`, {
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] || `export.${format === "coco" ? "json" : "json"}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 800, height: 600 });
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadAssetWithMeta(file: File) {
  const [uploaded, size] = await Promise.all([uploadAsset(file), readImageSize(file)]);
  return {
    filename: file.name,
    storageKey: uploaded.storage_key,
    mimeType: uploaded.mime_type,
    width: size.width,
    height: size.height,
    fileSize: file.size,
  };
}
