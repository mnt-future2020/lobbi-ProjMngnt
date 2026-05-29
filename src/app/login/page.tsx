"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

// Office coordinates — login allowed only within 30 metres of this point
const OFFICE_LAT = 9.971978350900422;
const OFFICE_LNG = 78.13480417116385;
const MAX_DISTANCE_METERS = 100;
const ADMIN_EMAIL = "kansha@mntfuture.com";

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locStatus, setLocStatus] = useState<"idle" | "checking" | "denied" | "far">("idle");
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    setLocStatus("idle");

    try {
      // Admin can login from anywhere
      if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
        setLocStatus("checking");
        let pos: GeolocationPosition;
        try {
          pos = await getCurrentPosition();
        } catch (err: any) {
          setLocStatus("denied");
          setLoading(false);
          return;
        }

        const dist = haversineMeters(
          OFFICE_LAT,
          OFFICE_LNG,
          pos.coords.latitude,
          pos.coords.longitude
        );

        if (dist > MAX_DISTANCE_METERS) {
          setLocStatus("far");
          setLoading(false);
          return;
        }

        setLocStatus("idle");
      }

      const result = await login(email, password);
      toast.success("Login successful!");

      if (result.user.isAdmin) {
        router.push("/");
      } else {
        router.push("/portal");
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="LOBBI" className="h-14 object-contain mx-auto mb-4 brightness-0 invert" />
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-gray-400 mt-1">
            Sign in to LOBBI Project Management
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Location status messages */}
            {locStatus === "checking" && (
              <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 text-sm">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                Verifying your location…
              </div>
            )}

            {locStatus === "denied" && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Location access was denied. Please allow location permission in your browser and try again.
                </span>
              </div>
            )}

            {locStatus === "far" && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  You must be at the office to log in. Move within <strong>100 metres</strong> of the office and try again.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {locStatus === "checking" ? "Checking location…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
