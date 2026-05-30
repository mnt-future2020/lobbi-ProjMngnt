export interface IDeveloper {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  phone: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface IFolder {
  _id: string;
  name: string;
  project: string;
  order: number;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IProject {
  _id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  members: IDeveloper[] | string[];
  createdAt: string;
  updatedAt: string;
}

export interface IAttachment {
  filename: string;
  path: string;
  uploadedAt: string;
}

export interface ITask {
  _id: string;
  title: string;
  description: string;
  status: "Pending" | "In Progress" | "Completed";
  priority: "Low" | "Medium" | "High";
  assignee: IDeveloper | string | null; // legacy single
  assignees: (IDeveloper | string)[];
  project: IProject | string;
  folder: IFolder | string | null;
  hours: number | null;
  dueDate: string | null;
  date: string;
  attachments: IAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IRole {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendanceLog {
  _id: string;
  developer: IDeveloper | string;
  action: "login" | "logout";
  remark: string | null;
  timestamp: string;
  date: string; // YYYY-MM-DD
}

export const STATUS_OPTIONS = ["Pending", "In Progress", "Completed"] as const;
export const PRIORITY_OPTIONS = ["Low", "Medium", "High"] as const;
