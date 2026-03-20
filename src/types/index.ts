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
  assignee: IDeveloper | string | null;
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

export const STATUS_OPTIONS = ["Pending", "In Progress", "Completed"] as const;
export const PRIORITY_OPTIONS = ["Low", "Medium", "High"] as const;
