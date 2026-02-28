import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api, loadAuthToken, setAuthToken } from "./lib/api";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import CcdDashboard from "./pages/CcdDashboard";

type Role = "STUDENT" | "COORDINATOR" | "CCD_ADMIN" | "CCD_MEMBER" | null;

function App() {
  const [token, setTokenState] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const tok = loadAuthToken();
    if (tok) setTokenState(tok);
  }, []);

  const handleLogout = () => {
    setAuthToken(undefined);
    setTokenState(null);
    setRole(null);
    navigate("/");
  };

  const handleLogin = (t: string, r: Role) => {
    setAuthToken(t);
    setTokenState(t);
    setRole(r);
    switch (r) {
      case "STUDENT":
        navigate("/student");
        break;
      case "COORDINATOR":
        navigate("/coordinator");
        break;
      case "CCD_ADMIN":
      case "CCD_MEMBER":
        navigate("/ccd");
        break;
      default:
        navigate("/");
    }
  };

  const dashboard = useMemo(() => {
    if (!token || !role) return <Navigate to="/" />;
    if (role === "STUDENT") return <StudentDashboard onLogout={handleLogout} />;
    if (role === "COORDINATOR") return <CoordinatorDashboard onLogout={handleLogout} />;
    return <CcdDashboard onLogout={handleLogout} role={role} />;
  }, [token, role]);

  return (
    <Routes>
      <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/student" element={dashboard} />
      <Route path="/coordinator" element={dashboard} />
      <Route path="/ccd" element={dashboard} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;











