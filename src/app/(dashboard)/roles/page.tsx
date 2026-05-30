"use client";

import { useState, Suspense } from "react";
import useSWR from "swr";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ShieldCheck,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn, apiError } from "@/lib/utils";
import { IRole } from "@/types";
import { useConfirm } from "@/components/ConfirmModal";
import { PERMISSIONS, PERMISSION_MODULES } from "@/lib/permissions";
import Portal from "@/components/Portal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ROLE_COLORS = [
  { value: null, label: "Default", dot: "bg-gray-400" },
  { value: "indigo", label: "Indigo", dot: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "blue", label: "Blue", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "green", label: "Green", dot: "bg-green-500", badge: "bg-green-100 text-green-700 border-green-200" },
  { value: "orange", label: "Orange", dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "red", label: "Red", dot: "bg-red-500", badge: "bg-red-100 text-red-700 border-red-200" },
  { value: "purple", label: "Purple", dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700 border-purple-200" },
];

function getRoleBadge(color?: string | null) {
  return ROLE_COLORS.find((c) => c.value === (color ?? null)) ?? ROLE_COLORS[0];
}

function RolesPageContent() {
  const confirm = useConfirm();
  const { data: roles = [], isLoading, mutate } = useSWR<IRole[]>("/api/roles", fetcher, {
    revalidateOnFocus: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<IRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
    color: null as string | null,
  });

  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: "", description: "", permissions: [], color: null });
    setShowModal(true);
  };

  const openEdit = (role: IRole) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || "",
      permissions: [...role.permissions],
      color: role.color,
    });
    setShowModal(true);
  };

  const togglePermission = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const toggleModule = (moduleKey: string) => {
    const mod = PERMISSION_MODULES.find((m) => m.key === moduleKey);
    if (!mod) return;
    const groupKeys = mod.permissions.map((p) => p.key);
    const allSelected = groupKeys.every((k) => form.permissions.includes(k));
    setForm((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((p) => !groupKeys.includes(p))
        : [...prev.permissions, ...groupKeys.filter((k) => !prev.permissions.includes(k))],
    }));
  };

  const saveRole = async () => {
    if (!form.name.trim()) { toast.error("Role name is required"); return; }
    setSaving(true);
    try {
      const body = { name: form.name.trim(), description: form.description.trim(), permissions: form.permissions, color: form.color };
      const url = editingRole ? `/api/roles/${editingRole._id}` : "/api/roles";
      const method = editingRole ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(editingRole ? "Role updated" : "Role created");
      setShowModal(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role: IRole) => {
    const { confirmed } = await confirm({ title: "Delete Role", message: `Delete role "${role.name}"? Users with this role will need to be reassigned.`, confirmLabel: "Delete", variant: "danger" });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/roles/${role._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Role deleted");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete role");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">{roles.length} role{roles.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Role
        </button>
      </div>

      {/* Role Cards */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : roles.length === 0 ? (
        <div className="card p-16 text-center">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No roles yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first role to assign to users</p>
          <button onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Role
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => {
            const badge = getRoleBadge(role.color);
            const isExpanded = expandedRole === role._id;
            return (
              <div key={role._id} className="card overflow-hidden">
                {/* Role header row */}
                <div className="p-5 flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", badge.dot ? `${badge.dot} bg-opacity-20` : "bg-gray-100")}>
                    <ShieldCheck className={cn("w-5 h-5", role.color ? `text-${role.color}-600` : "text-gray-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        (badge as any).badge || "bg-gray-100 text-gray-600 border-gray-200"
                      )}>
                        {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {role.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>
                    )}
                    {/* Module access pills preview */}
                    {role.permissions.length > 0 && !isExpanded && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {PERMISSION_MODULES.map((mod) => {
                          const modPerms = mod.permissions.filter((p) => role.permissions.includes(p.key));
                          if (modPerms.length === 0) return null;
                          const full = modPerms.length === mod.permissions.length;
                          return (
                            <span key={mod.key} className={cn(
                              "inline-flex text-[11px] px-2 py-0.5 rounded-full",
                              full ? "bg-green-100 text-green-700" : "bg-yellow-50 text-yellow-700"
                            )}>
                              {mod.name} {full ? `(Full)` : `(${modPerms.length}/${mod.permissions.length})`}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedRole(isExpanded ? null : role._id)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                      title={isExpanded ? "Collapse" : "View permissions"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEdit(role)} className="p-2 hover:bg-brand/10 rounded-lg text-gray-400 hover:text-brand" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteRole(role)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded permissions — module wise */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    {role.permissions.length === 0 ? (
                      <p className="text-sm text-gray-400">No permissions assigned</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {PERMISSION_MODULES.map((mod) => {
                          const modPerms = mod.permissions.filter((p) => role.permissions.includes(p.key));
                          if (modPerms.length === 0) return null;
                          const full = modPerms.length === mod.permissions.length;
                          return (
                            <div key={mod.key} className="bg-white rounded-xl border border-gray-200 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-gray-700">{mod.name}</p>
                                <span className={cn(
                                  "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                                  full ? "bg-green-100 text-green-700" : "bg-yellow-50 text-yellow-700"
                                )}>
                                  {full ? "Full Access" : `${modPerms.length}/${mod.permissions.length}`}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {mod.permissions.map((p) => {
                                  const has = role.permissions.includes(p.key);
                                  return (
                                    <div key={p.key} className="flex items-center gap-2">
                                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", has ? "bg-green-500" : "bg-gray-200")} />
                                      <span className={cn("text-xs", has ? "text-gray-700" : "text-gray-300 line-through")}>{p.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Portal><div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[100] p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingRole ? "Edit Role" : "New Role"}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Frontend Developer, Designer, Manager"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Brief description of this role"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {ROLE_COLORS.map((c) => (
                    <button
                      key={c.value ?? "default"}
                      type="button"
                      title={c.label}
                      onClick={() => setForm({ ...form, color: c.value })}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                        c.dot,
                        form.color === c.value ? "border-gray-800 scale-110" : "border-transparent"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Module-wise Permissions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Module Permissions</label>
                  <span className="text-xs text-gray-400">{form.permissions.length} selected</span>
                </div>
                <div className="space-y-3">
                  {PERMISSION_MODULES.map((mod) => {
                    const allSelected = mod.permissions.every((p) => form.permissions.includes(p.key));
                    const someSelected = mod.permissions.some((p) => form.permissions.includes(p.key));
                    return (
                      <div key={mod.key} className={cn(
                        "border rounded-xl overflow-hidden transition-colors",
                        allSelected ? "border-brand/30 bg-brand/5" : someSelected ? "border-yellow-200 bg-yellow-50/30" : "border-gray-100"
                      )}>
                        {/* Module header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white/80">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                              onChange={() => toggleModule(mod.key)}
                              className="w-4 h-4 accent-brand cursor-pointer"
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{mod.name}</p>
                              <p className="text-[11px] text-gray-400">{mod.description}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            allSelected ? "bg-green-100 text-green-700"
                              : someSelected ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-400"
                          )}>
                            {allSelected ? "Full" : someSelected ? `${mod.permissions.filter((p) => form.permissions.includes(p.key)).length}/${mod.permissions.length}` : "None"}
                          </span>
                        </div>
                        {/* Individual permissions */}
                        <div className="px-4 pb-3 pt-1 flex flex-wrap gap-1.5">
                          {mod.permissions.map((perm) => (
                            <label
                              key={perm.key}
                              title={perm.description}
                              className={cn(
                                "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full border text-xs cursor-pointer transition-colors",
                                form.permissions.includes(perm.key)
                                  ? "bg-brand/10 border-brand/30 text-brand font-medium"
                                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={form.permissions.includes(perm.key)}
                                onChange={() => togglePermission(perm.key)}
                                className="w-3 h-3 accent-brand cursor-pointer"
                              />
                              {perm.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1" disabled={saving}>
                Cancel
              </button>
              <button onClick={saveRole} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingRole ? "Update Role" : "Create Role"}
              </button>
            </div>
          </div>
        </div></Portal>
      )}
    </div>
  );
}

export default function RolesPage() {
  return (
    <Suspense>
      <RolesPageContent />
    </Suspense>
  );
}
