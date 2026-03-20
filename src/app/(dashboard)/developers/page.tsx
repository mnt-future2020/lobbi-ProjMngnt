"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Loader2,
  User,
  Mail,
  Phone,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useDevelopersPaginated } from "@/hooks/useDevelopers";
import { cn, formatDate } from "@/lib/utils";
import { IDeveloper } from "@/types";

const roles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "DevOps Engineer",
  "Project Manager",
  "QA Engineer",
];

export default function DevelopersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const params: Record<string, string> = {
    page: String(page),
    limit: "12",
  };
  if (search) params.search = search;
  if (filterDate) { params.dateFrom = filterDate; params.dateTo = filterDate; }

  const { developers, total, totalPages, isLoading, mutate } = useDevelopersPaginated(params);

  const [showModal, setShowModal] = useState(false);
  const [editingDev, setEditingDev] = useState<IDeveloper | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    phone: "",
    status: "active",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const openAddModal = () => {
    setEditingDev(null);
    setFormData({ name: "", email: "", password: "", role: "", phone: "", status: "active" });
    setAvatarFile(null);
    setAvatarPreview("");
    setShowModal(true);
  };

  const openEditModal = (dev: IDeveloper) => {
    setEditingDev(dev);
    setFormData({
      name: dev.name,
      email: dev.email,
      password: "",
      role: dev.role,
      phone: dev.phone || "",
      status: dev.status,
    });
    setAvatarFile(null);
    setAvatarPreview(dev.avatar || "");
    setShowModal(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!editingDev && !formData.password) {
      toast.error("Password is required for new developers");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("email", formData.email);
      fd.append("role", formData.role);
      fd.append("phone", formData.phone);
      fd.append("status", formData.status);
      if (formData.password) fd.append("password", formData.password);
      if (avatarFile) fd.append("avatar", avatarFile);

      const url = editingDev
        ? `/api/developers/${editingDev._id}`
        : "/api/developers";
      const method = editingDev ? "PUT" : "POST";

      const res = await fetch(url, { method, body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }

      toast.success(editingDev ? "Developer updated" : "Developer added");
      setShowModal(false);
      mutate();
    } catch {
      toast.error("Failed to save developer");
    } finally {
      setSaving(false);
    }
  };

  const deleteDev = async (id: string) => {
    if (!confirm("Delete this developer?")) return;
    try {
      const res = await fetch(`/api/developers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Developer deleted");
      mutate();
    } catch {
      toast.error("Failed to delete developer");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilterDate("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Developer Management</h1>
          <p className="text-sm text-gray-500 mt-1">{total} team members</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Developer
        </button>
      </div>

      {/* Search & Filters - Always visible */}
      <div className="card p-4 lg:p-5 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, role..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <input
            type="date"
            className="input-field w-auto text-sm"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
          />
          {(search || filterDate) && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Developer Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : developers.length === 0 ? (
        <div className="card p-12 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{search || filterDate ? "No developers found" : "No developers yet"}</p>
          {!search && !filterDate && (
            <p className="text-sm text-gray-400 mt-1">Add your first team member to get started</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {developers.map((dev) => (
            <div key={dev._id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                {dev.avatar ? (
                  <img src={dev.avatar} alt={dev.name} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-brand">{dev.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(dev)} className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteDev(dev._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900">{dev.name}</h3>
              <p className="text-sm text-brand font-medium mt-0.5">{dev.role}</p>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{dev.email}</span>
                </div>
                {dev.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{dev.phone}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full", dev.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                  {dev.status === "active" ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-gray-400">{formatDate(dev.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm text-gray-500">
            Page {page} of {totalPages} ({total})
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-sm font-medium",
                    page === pageNum ? "bg-brand text-white" : "hover:bg-gray-100 text-gray-600"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingDev ? "Edit Developer" : "Add Developer"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center">
                <label className="cursor-pointer group">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  {avatarPreview ? (
                    <div className="relative">
                      <img src={avatarPreview} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingDev ? "(leave blank to keep)" : "*"}
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder={editingDev ? "Leave blank to keep current" : "Enter password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingDev}
                  minLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select className="select-field" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required>
                  <option value="">Select Role</option>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" className="input-field" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              {editingDev && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="select-field" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingDev ? "Update" : "Add Developer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
