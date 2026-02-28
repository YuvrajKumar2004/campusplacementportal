import { useState } from "react";
import { api } from "../lib/api";

type Role = "STUDENT" | "COORDINATOR" | "CCD_ADMIN" | "CCD_MEMBER";

interface Props {
  onLogin: (token: string, role: Role) => void;
}

const roles: Role[] = ["STUDENT", "COORDINATOR", "CCD_ADMIN", "CCD_MEMBER"];

export default function LoginPage({ onLogin }: Props) {
  const [role, setRole] = useState<Role>("STUDENT");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { loginId, password, role });
      onLogin(res.data.token, res.data.role);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Full-Screen Background Image with 50% Opacity */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/NITA.PNG')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.5
        }}
      />
      <div className="absolute inset-0 bg-white/30" />

      {/* Centered Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-8 md:p-10">
          {/* Logo and Heading Section */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img 
                src="/NITA_LOGO.PNG" 
                alt="NITA Logo" 
                className="h-12 w-auto object-contain flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                NITA Placement Portal
              </h1>
            </div>
            <p className="text-sm text-slate-500 text-center font-medium">
              National Institute of Technology, Agartala
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Select Role
              </label>
              <select
                id="role"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-400"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as Role);
                  setError(null);
                }}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Login ID Input */}
            <div>
              <label htmlFor="loginId" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Login ID
              </label>
              <input
                id="loginId"
                type="text"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-400"
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your enrollment/login ID"
                required
                autoComplete="username"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-400"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Sign In Button */}
            <button 
              type="submit" 
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600 flex items-center justify-center gap-2 mt-6" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium"
                onClick={() => {
                  // View-only functionality - no action needed
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Helper Text */}
            <div className="pt-4 border-t border-slate-200 mt-4">
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Use role-based credentials. Seeded accounts: students (23ucs001/23uec001/23uee001/23uics001) with password "student"; coordinator (tnp/password); CCD admin (admin1/password); CCD member (ccd1/password)
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} NITA Placement Cell. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}




