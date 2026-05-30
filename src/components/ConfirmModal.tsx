"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  /** Extra form fields rendered inside the modal */
  fields?: ConfirmField[];
}

interface ConfirmField {
  key: string;
  label: string;
  type: "text" | "select" | "date";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

interface ConfirmResult {
  confirmed: boolean;
  values: Record<string, string>;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<ConfirmResult>;

// ── Context ──

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve({ confirmed: false, values: {} }));

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

// ── Provider ──

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: ((result: ConfirmResult) => void) | null;
    loading: boolean;
  }>({ open: false, options: { message: "" }, resolve: null, loading: false });

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const confirm = useCallback<ConfirmFn>((options) => {
    // Initialize field defaults
    const defaults: Record<string, string> = {};
    options.fields?.forEach((f) => {
      defaults[f.key] = f.defaultValue || "";
    });
    setFieldValues(defaults);

    return new Promise<ConfirmResult>((resolve) => {
      setState({ open: true, options, resolve, loading: false });
    });
  }, []);

  const handleConfirm = () => {
    // Check required fields
    const missing = state.options.fields?.find((f) => f.required && !fieldValues[f.key]?.trim());
    if (missing) return;

    state.resolve?.({ confirmed: true, values: fieldValues });
    setState((s) => ({ ...s, open: false }));
  };

  const handleCancel = () => {
    state.resolve?.({ confirmed: false, values: {} });
    setState((s) => ({ ...s, open: false }));
  };

  const variant = state.options.variant || "danger";
  const variantStyles = {
    danger: {
      icon: "bg-red-100 text-red-600",
      button: "bg-red-500 hover:bg-red-600 text-white",
    },
    warning: {
      icon: "bg-yellow-100 text-yellow-600",
      button: "bg-yellow-500 hover:bg-yellow-600 text-white",
    },
    info: {
      icon: "bg-blue-100 text-blue-600",
      button: "bg-brand hover:bg-brand-dark text-white",
    },
  }[variant];

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start gap-4 p-6 pb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", variantStyles.icon)}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900">
                  {state.options.title || "Confirm"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {state.options.message}
                </p>
              </div>
              <button onClick={handleCancel} className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Fields */}
            {state.options.fields && state.options.fields.length > 0 && (
              <div className="px-6 pb-4 space-y-3">
                {state.options.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    {field.type === "select" ? (
                      <select
                        className="select-field"
                        value={fieldValues[field.key] || ""}
                        onChange={(e) => setFieldValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      >
                        <option value="">{field.placeholder || "Select..."}</option>
                        {field.options?.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : field.type === "date" ? (
                      <input
                        type="date"
                        className="input-field"
                        value={fieldValues[field.key] || ""}
                        onChange={(e) => setFieldValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      />
                    ) : (
                      <input
                        type="text"
                        className="input-field"
                        placeholder={field.placeholder}
                        value={fieldValues[field.key] || ""}
                        onChange={(e) => setFieldValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-2">
              <button
                onClick={handleCancel}
                className="btn-secondary flex-1"
              >
                {state.options.cancelLabel || "Cancel"}
              </button>
              <button
                onClick={handleConfirm}
                className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors", variantStyles.button)}
              >
                {state.options.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
