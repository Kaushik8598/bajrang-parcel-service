"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Truck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, saveAuthData } from "@/lib/api/auth";
import type { LoginRequest } from "@/lib/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginRequest>({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      saveAuthData(data);
      router.push("/dashboard");
    },
    onError: (err: Error) => {
      setError(err.message || "Invalid credentials. Please try again.");
    },
  });

  // ── Demo login (development only — no API needed) ──────────────────────────
  const handleDemoLogin = () => {
    saveAuthData({
      token: "demo-token-123",
      user: { id: 1, name: "Admin", email: "admin@bajrang.com", mobile: "9876543210", role: "admin" },
      permissions: [
        { module: "manage_admin", can_view: true, can_add: true, can_edit: true, can_delete: true, can_export: true, can_status: true },
        { module: "manage_branch", can_view: true, can_add: true, can_edit: true, can_delete: true, can_export: true, can_status: true },
        { module: "manage_branch_user", can_view: true, can_add: true, can_edit: true, can_delete: true, can_export: true, can_status: true },
        { module: "manage_customer", can_view: true, can_add: true, can_edit: true, can_delete: true, can_export: true, can_status: true },
        { module: "manage_truck", can_view: true, can_add: true, can_edit: true, can_delete: true, can_export: true, can_status: true },
        { module: "manage_driver", can_view: true, can_add: true, can_edit: true, can_delete: true, can_export: true, can_status: true },
        { module: "admin_wise_payment", can_view: true, can_add: false, can_edit: false, can_delete: false, can_export: true, can_status: false },
        { module: "booking", can_view: true, can_add: true, can_edit: true, can_delete: false, can_export: true, can_status: true },
        { module: "delivery", can_view: true, can_add: true, can_edit: true, can_delete: false, can_export: true, can_status: true },
        { module: "memo", can_view: true, can_add: true, can_edit: true, can_delete: true, can_export: true, can_status: true },
        { module: "booking_report", can_view: true, can_add: false, can_edit: false, can_delete: false, can_export: true, can_status: false },
        { module: "delivery_report", can_view: true, can_add: false, can_edit: false, can_delete: false, can_export: true, can_status: false },
        { module: "manage_user_rights", can_view: true, can_add: true, can_edit: true, can_delete: true, can_export: false, can_status: true },
        { module: "website_settings", can_view: true, can_add: true, can_edit: true, can_delete: false, can_export: false, can_status: false },
      ],
      menu: [],
      balance: 3905,
      notifications: 214535,
    });
    router.push("/dashboard");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.username || !formData.password) {
      setError("Please enter username and password.");
      return;
    }
    loginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-teal-50">
      {/* Decorative background blobs */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#2c3e50]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3498db]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm mx-4">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-200/60 border border-white/60 overflow-hidden">
          {/* Header band */}
          <div className="bg-[#2c3e50] px-8 py-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 rounded-full mb-3">
              <Truck className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-white font-bold text-lg leading-tight tracking-wide">
              BAJRANG Road Lines
            </h1>
            <p className="text-white/70 text-xs mt-0.5 tracking-wider uppercase">
              &amp; Parcel Service
            </p>
          </div>

          {/* Form body */}
          <div className="px-8 py-7">
            <p className="text-slate-500 text-sm text-center mb-6">
              Sign in to your account
            </p>

            <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-slate-600 text-xs font-medium uppercase tracking-wide">
                  Username / Mobile
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username or mobile"
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, username: e.target.value }))
                  }
                  className="h-10 border-slate-200 focus:border-[#3498db] focus:ring-[#3498db]/20 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-600 text-xs font-medium uppercase tracking-wide">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, password: e.target.value }))
                    }
                    className="h-10 pr-10 border-slate-200 focus:border-[#3498db] focus:ring-[#3498db]/20 transition-colors"
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="text-[#e74c3c] text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2"
                >
                  {error}
                </div>
              )}

              <Button
                id="login-btn"
                type="submit"
                className="w-full h-10 bg-[#2980b9] hover:bg-[#2471a3] text-white font-medium transition-all duration-200 mt-2 shadow-md shadow-blue-200/50"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <a
                href="/forgot-password"
                id="forgot-password-link"
                className="text-[#3498db] text-sm hover:text-[#2471a3] hover:underline transition-colors"
              >
                Forgot Password?
              </a>
            </div>

            {/* Demo login — remove in production */}
            <div className="mt-5 pt-4 border-t border-dashed border-slate-200">
              <p className="text-center text-slate-400 text-[10px] mb-2 uppercase tracking-wider">Development Only</p>
              <Button
                id="demo-login-btn"
                type="button"
                variant="outline"
                className="w-full h-9 text-xs text-slate-500 border-slate-200 hover:bg-slate-50"
                onClick={handleDemoLogin}
              >
                🚀 Demo Login (API vinā)
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-5">
          © {new Date().getFullYear()} Bajrang Road Lines &amp; Parcel Service
        </p>
      </div>
    </div>
  );
}
