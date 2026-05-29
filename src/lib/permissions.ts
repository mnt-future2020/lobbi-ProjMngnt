export interface Permission {
  key: string;
  label: string;
  description: string;
  module: string;
  icon?: string; // lucide icon name for reference
}

export interface PermissionModule {
  name: string;
  key: string; // module prefix e.g. "dashboard", "tasks"
  description: string;
  permissions: Permission[];
}

// ── Module-wise permissions matching sidebar ──

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    name: "Dashboard",
    key: "dashboard",
    description: "Analytics, stats and overview",
    permissions: [
      { key: "dashboard.view", label: "View Dashboard", description: "Access the dashboard and view statistics", module: "Dashboard" },
    ],
  },
  {
    name: "Tasks",
    key: "tasks",
    description: "Task management and assignments",
    permissions: [
      { key: "tasks.view",     label: "View Assigned Tasks",  description: "View only tasks assigned to this user",     module: "Tasks" },
      { key: "tasks.view_all", label: "View All Tasks",       description: "View all tasks in the project, not just assigned", module: "Tasks" },
      { key: "tasks.create",   label: "Create Tasks",         description: "Create new tasks and assign to users",      module: "Tasks" },
      { key: "tasks.edit",     label: "Edit Tasks",           description: "Edit task status, priority and details",    module: "Tasks" },
      { key: "tasks.delete",   label: "Delete Tasks",         description: "Delete tasks permanently",                  module: "Tasks" },
      { key: "tasks.import",   label: "Import Tasks",         description: "Bulk import tasks from Excel/CSV",          module: "Tasks" },
      { key: "tasks.upload",   label: "Upload Attachments",   description: "Upload images and files to tasks",          module: "Tasks" },
    ],
  },
  {
    name: "Users",
    key: "users",
    description: "User accounts and profiles",
    permissions: [
      { key: "users.view",   label: "View Users",   description: "View user list and profiles",           module: "Users" },
      { key: "users.create", label: "Create Users",  description: "Add new user accounts",                 module: "Users" },
      { key: "users.edit",   label: "Edit Users",    description: "Edit user details, role and status",    module: "Users" },
      { key: "users.delete", label: "Delete Users",  description: "Remove user accounts",                  module: "Users" },
    ],
  },
  {
    name: "Roles & Permissions",
    key: "roles",
    description: "Role management and access control",
    permissions: [
      { key: "roles.view",   label: "View Roles",   description: "View roles and their permissions",      module: "Roles & Permissions" },
      { key: "roles.create", label: "Create Roles",  description: "Create new roles with permissions",     module: "Roles & Permissions" },
      { key: "roles.edit",   label: "Edit Roles",    description: "Modify role permissions",               module: "Roles & Permissions" },
      { key: "roles.delete", label: "Delete Roles",  description: "Remove roles from the system",          module: "Roles & Permissions" },
    ],
  },
  {
    name: "Projects",
    key: "projects",
    description: "Project and folder management",
    permissions: [
      { key: "projects.view",   label: "View Projects",   description: "View project list and details",       module: "Projects" },
      { key: "projects.create", label: "Create Projects",  description: "Create new projects",                 module: "Projects" },
      { key: "projects.edit",   label: "Edit Projects",    description: "Edit project details and members",    module: "Projects" },
      { key: "projects.delete", label: "Delete Projects",  description: "Delete projects permanently",         module: "Projects" },
      { key: "projects.switch", label: "Switch Projects",  description: "Switch between projects in portal",   module: "Projects" },
    ],
  },
  {
    name: "Folders",
    key: "folders",
    description: "Folder organization within projects",
    permissions: [
      { key: "folders.view",   label: "View Folders",   description: "View folder list inside projects",    module: "Folders" },
      { key: "folders.create", label: "Create Folders",  description: "Create new folders in projects",      module: "Folders" },
      { key: "folders.edit",   label: "Edit Folders",    description: "Rename folders and change colors",    module: "Folders" },
      { key: "folders.delete", label: "Delete Folders",  description: "Delete folders from projects",        module: "Folders" },
    ],
  },
  {
    name: "Attendance",
    key: "attendance",
    description: "Login/logout tracking and logs",
    permissions: [
      { key: "attendance.view",   label: "View Attendance",   description: "View attendance logs and history",     module: "Attendance" },
      { key: "attendance.create", label: "Add Entries",        description: "Manually add attendance entries",      module: "Attendance" },
      { key: "attendance.edit",   label: "Edit Entries",       description: "Edit existing attendance records",     module: "Attendance" },
      { key: "attendance.delete", label: "Delete Entries",     description: "Remove attendance records",            module: "Attendance" },
    ],
  },
];

// Flat list of all permissions (for backward compat)
export const PERMISSIONS: Permission[] = PERMISSION_MODULES.flatMap((m) => m.permissions);

// Unique group names
export const PERMISSION_GROUPS = PERMISSION_MODULES.map((m) => m.name);

export function hasPermission(permissions: string[], key: string): boolean {
  return permissions.includes(key);
}

// Check if a role has ANY permission in a module (for sidebar visibility)
export function hasModuleAccess(permissions: string[], moduleKey: string): boolean {
  return permissions.some((p) => p.startsWith(moduleKey + "."));
}
