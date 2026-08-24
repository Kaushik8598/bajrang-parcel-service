"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Truck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, saveAuthData } from "@/lib/api/auth";
import { showToast } from "@/lib/toast";
import type { LoginRequest, AuthResponseData } from "@/lib/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (data: AuthResponseData) => {
      saveAuthData(data);
      showToast("success", "Login successful!", `Welcome back, ${data.user.name || "Admin"}`);
      router.push("/dashboard");
    },
    onError: (err: Error) => {
      const errMsg = err.message || "Invalid credentials. Please try again.";
      showToast("error", errMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      const msg = "Please enter username/mobile/email and password.";
      showToast("warning", msg);
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
                <Label htmlFor="email" className="text-black text-xs font-bold uppercase tracking-wide">
                  Username / Mobile / Email
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter username, mobile or email"
                  autoComplete="username"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  className="h-10 border border-black focus-visible:border-black focus-visible:ring-black/20 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-black text-xs font-bold uppercase tracking-wide">
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
                    className="h-10 pr-10 border border-black focus-visible:border-black focus-visible:ring-black/20 transition-colors"
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

              <Button
                id="login-btn"
                type="submit"
                className="w-full h-10 bg-[#2980b9] hover:bg-[#2471a3] text-white font-semibold transition-all duration-200 mt-2 shadow-md shadow-blue-200/50"
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
                className="text-[#3498db] text-xs font-semibold hover:text-[#2471a3] hover:underline transition-colors"
              >
                Forgot Password?
              </a>
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
