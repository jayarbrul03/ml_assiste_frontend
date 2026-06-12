export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql";

export type UserRole = "admin" | "ml_engineer" | "labeler" | "reviewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LabelClass {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface AnnotationGeometry {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
}

export interface Annotation {
  id: string;
  labelClassId: string;
  labelClassName: string;
  labelClassColor: string;
  type: "bbox" | "polygon";
  geometry: AnnotationGeometry;
  source: "human" | "prelabel" | "corrected";
  version: number;
}

export interface PrelabelPrediction {
  id: string;
  labelClassId: string;
  labelClassName: string;
  labelClassColor: string;
  type: "bbox" | "polygon";
  geometry: AnnotationGeometry;
  confidence: number;
}

export const DEMO_USERS = [
  { email: "admin@demo.com", password: "admin123", role: "admin", label: "Admin" },
  { email: "ml@demo.com", password: "ml123", role: "ml_engineer", label: "ML Engineer" },
  { email: "labeler@demo.com", password: "label123", role: "labeler", label: "Labeler" },
  { email: "reviewer@demo.com", password: "review123", role: "reviewer", label: "Reviewer" },
];
