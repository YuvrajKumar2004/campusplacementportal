import { useEffect, useState, useRef } from "react";
import TopBar from "../components/TopBar";
import { api } from "../lib/api";

interface Props {
  onLogout: () => void;
  role: "CCD_ADMIN" | "CCD_MEMBER";
}

export default function CcdDashboard({ onLogout, role }: Props) {
  const [stats, setStats] = useState<any>({
    totalStudents: 0,
    placedStudents: 0,
    placedCounts: [],
    branchPlacedCounts: [],
    branchTotalCounts: [],
    lockedStudentsCount: 0,
  });
  const [userForm, setUserForm] = useState({ loginId: "", password: "", role: "COORDINATOR" });
  const [lockEnrollment, setLockEnrollment] = useState("");
  const [lockValue, setLockValue] = useState(false);
  const [lockedStudentsList, setLockedStudentsList] = useState<any[]>([]);
  const [showLockedList, setShowLockedList] = useState(false);
  const [profileUserId, setProfileUserId] = useState("");
  const [profileSearch, setProfileSearch] = useState({ type: "enrollment", value: "" });
  const [profile, setProfile] = useState<any | null>(null);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [showStudentsList, setShowStudentsList] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentForm, setStudentForm] = useState<any>({
    loginId: "",
    password: "",
    name: "",
    email: "",
    mobile: "",
    enrollment: "",
    branch: "",
    cgpa: "",
    xPercentage: "",
    xiiPercentage: "",
    activeBacklogs: 0,
    deadBacklogs: 0,
    placementStatus: "UNPLACED",
    hasYearGap: false,
    yearGapDuration: "",
    cv1Url: "",
    cv2Url: "",
    cv3Url: "",
    tpoName: "",
    tpoEmail: "",
    tpoMobile: "",
    tnpName: "",
    tnpEmail: "",
    tnpMobile: "",
    icName: "",
    icEmail: "",
    icMobile: "",
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [googleSheetLink, setGoogleSheetLink] = useState("");
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    const res = await api.get("/ccd/dashboard");
    setStats(res.data);
  };

  useEffect(() => {
    fetchStats().catch(console.error);
  }, []);

  const fetchStudentsList = async () => {
    try {
      const res = await api.get("/ccd/students");
      setStudentsList(res.data);
      setShowStudentsList(true);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to load students list");
    }
  };

  const createStudent = async () => {
    setMessage(null);
    if (!studentForm.loginId || !studentForm.password || !studentForm.enrollment || !studentForm.email || !studentForm.mobile || !studentForm.branch) {
      setMessage("Login ID, password, enrollment, email, mobile, and branch are required");
      return;
    }
    try {
      const res = await api.post("/ccd/students", studentForm);
      setMessage(`Student ${res.data.action} successfully`);
      setStudentForm({
        loginId: "",
        password: "",
        name: "",
        email: "",
        mobile: "",
        enrollment: "",
        branch: "",
        cgpa: "",
        xPercentage: "",
        xiiPercentage: "",
        activeBacklogs: 0,
        deadBacklogs: 0,
        placementStatus: "UNPLACED",
        hasYearGap: false,
        yearGapDuration: "",
        cv1Url: "",
        cv2Url: "",
        cv3Url: "",
        tpoName: "",
        tpoEmail: "",
        tpoMobile: "",
        tnpName: "",
        tnpEmail: "",
        tnpMobile: "",
        icName: "",
        icEmail: "",
        icMobile: "",
      });
      fetchStats(); // Refresh stats
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to create/update student");
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Simple CSV parser that handles quoted fields
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
    const students = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]).map((v) => v.replace(/^"|"$/g, "").trim());
      if (values.length === 0 || values.every((v) => !v)) continue; // Skip empty rows

      const student: any = {};
      headers.forEach((header, index) => {
        student[header] = values[index] || "";
      });
      students.push(student);
    }

    return students;
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setMessage("Please select a CSV file");
      return;
    }

    setCsvUploading(true);
    setMessage(null);

    try {
      // Parse CSV file
      const text = await csvFile.text();
      const students = parseCSV(text);

      if (students.length === 0) {
        setMessage("CSV file is empty or invalid. Please check the format.");
        setCsvUploading(false);
        return;
      }

      // Send to backend
      const res = await api.post("/ccd/students/bulk", { students });

      let resultMessage = `Bulk upload completed: ${res.data.created} created, ${res.data.updated} updated`;
      if (res.data.errors && res.data.errors.length > 0) {
        resultMessage += `, ${res.data.errors.length} errors`;
        console.error("CSV Upload Errors:", res.data.errors);
        // Show first few errors in message
        const errorDetails = res.data.errors.slice(0, 3).map((e: any) => `Row ${e.row}: ${e.error}`).join("; ");
        if (errorDetails) {
          resultMessage += ` (${errorDetails}${res.data.errors.length > 3 ? "..." : ""})`;
        }
      }
      setMessage(resultMessage);
      setCsvFile(null);
      if (csvFileInputRef.current) {
        csvFileInputRef.current.value = "";
      }
      fetchStats(); // Refresh stats
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to upload CSV file");
    } finally {
      setCsvUploading(false);
    }
  };

  const createUser = async () => {
    setMessage(null);
    if (!userForm.loginId || !userForm.password) {
      setMessage("Login ID and password are required");
      return;
    }
    try {
      await api.post("/ccd/users", { loginId: userForm.loginId, password: userForm.password, role: userForm.role });
      setMessage("User created/updated successfully");
      setUserForm({ loginId: "", password: "", role: "COORDINATOR" });
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to create/update user");
    }
  };

  const lockStudent = async () => {
    if (!lockEnrollment) {
      setMessage("Please enter an enrollment number");
      return;
    }

    try {
      await api.post(`/ccd/students/lock`, { enrollment: lockEnrollment, locked: lockValue });
      setMessage(`Student ${lockValue ? "locked" : "unlocked"} successfully`);
      setLockEnrollment("");
      fetchStats(); // Refresh stats to update locked count
      if (showLockedList) {
        fetchLockedStudents(); // Refresh locked list if it's visible
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to update lock state");
    }
  };

  const fetchLockedStudents = async () => {
    try {
      const res = await api.get("/ccd/students/locked");
      setLockedStudentsList(res.data);
      setShowLockedList(true);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to load locked students");
    }
  };

  const loadProfile = async () => {
    if (!profileSearch.value) {
      setMessage("Please enter a user ID, enrollment, or login ID");
      return;
    }

    try {
      let res;
      if (profileSearch.type === "userId") {
        const userId = Number(profileSearch.value);
        if (isNaN(userId)) {
          setMessage("Please enter a valid numeric user ID");
          setProfile(null);
          return;
        }
        res = await api.get(`/ccd/students/${profileSearch.value}/profile`);
      } else {
        // Search by enrollment or loginId
        const queryParam = profileSearch.type === "enrollment" ? "enrollment" : "loginId";
        res = await api.get(`/ccd/students/search?${queryParam}=${encodeURIComponent(profileSearch.value)}`);
        if (res.data && res.data.profile) {
          setProfile(res.data.profile);
          setProfileUserId(res.data.userId.toString());
          setMessage(`Profile loaded successfully (User ID: ${res.data.userId})`);
          return;
        }
      }

      if (res.data) {
        setProfile(res.data);
        setProfileUserId(profileSearch.type === "userId" ? profileSearch.value : "");
        setMessage("Profile loaded successfully");
      } else {
        setMessage("Profile not found");
        setProfile(null);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to load profile";
      setMessage(errorMessage);
      setProfile(null);
      console.error("Error loading profile:", err);
    }
  };

  const saveProfile = async () => {
    if (!profileUserId || !profile) {
      setMessage("Please load a profile first");
      return;
    }
    try {
      await api.put(`/ccd/students/${profileUserId}/profile`, profile);
      setMessage("Profile saved successfully");
      fetchStats(); // Refresh stats after profile update (placement status might have changed)
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to save profile");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-4">
      <TopBar title={`CCD ${role === "CCD_ADMIN" ? "Admin" : "Member"} Dashboard`} onLogout={onLogout} />
      {message && <div className="text-sm text-blue-700">{message}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Placement Statistics</h3>
          <div className="space-y-2">
            <div className="text-lg font-bold">
              {stats.placedStudents} / {stats.totalStudents} Students Placed
            </div>
            <div className="text-sm text-slate-600">
              {stats.totalStudents > 0
                ? `${((stats.placedStudents / stats.totalStudents) * 100).toFixed(1)}% placement rate`
                : "0% placement rate"}
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="text-sm font-semibold mb-1">By Status:</div>
              <ul className="text-sm space-y-1">
                {stats.placedCounts.map((p: any) => (
                  <li key={p.placementStatus}>
                    {p.placementStatus.replace(/_/g, " ")}: {p._count._all}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Branch-wise Placement Stats</h3>
          {stats.branchTotalCounts.length > 0 ? (
            <div className="space-y-3">
              {stats.branchTotalCounts.map((bt: any) => {
                // Find placed count for this branch (may be 0 if no students placed)
                const placedForBranch = stats.branchPlacedCounts.find(
                  (bp: any) => bp.branch === bt.branch
                )?._count._all || 0;
                const totalForBranch = bt._count._all || 0;
                const percentage = totalForBranch > 0 ? (placedForBranch / totalForBranch) * 100 : 0;
                return (
                  <div key={bt.branch} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{bt.branch}</span>
                      <span>
                        {placedForBranch} / {totalForBranch} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full flex items-center justify-center text-xs text-white"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      >
                        {placedForBranch > 0 && `${placedForBranch}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No branch data available</div>
          )}
        </div>
      </div>

      {role === "CCD_ADMIN" && (
        <>
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Add Students</h3>
              <button
                className="btn-secondary text-xs"
                onClick={() => setShowAddStudent(!showAddStudent)}
              >
                {showAddStudent ? "Hide" : "Show"} Add Student Form
              </button>
            </div>

            {/* CSV Upload Section */}
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-semibold text-sm mb-2">Bulk Upload from CSV</h4>
              <p className="text-xs text-slate-600 mb-2">
                Upload a CSV file with student data. If enrollment already exists, student will be updated.
              </p>
              <div className="flex gap-2 items-center">
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
                <input
                  type="text"
                  placeholder="Paste Google Sheet link here"
                  value={googleSheetLink}
                  onChange={(e) => setGoogleSheetLink(e.target.value)}
                  className="input text-sm flex-1"
                />
                <button
                  className="btn-primary text-xs"
                  onClick={handleCsvUpload}
                  disabled={!csvFile || csvUploading}
                >
                  {csvUploading ? "Uploading..." : "Upload CSV"}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                CSV should include: loginId, password, name, email, mobile, enrollment, branch, and other optional fields
              </p>
            </div>

            {/* Manual Student Creation Form */}
            {showAddStudent && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">Add / Update Single Student</h4>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <label className="label">Login ID *</label>
                      <input
                        className="input"
                        value={studentForm.loginId}
                        onChange={(e) => setStudentForm({ ...studentForm, loginId: e.target.value })}
                        placeholder="e.g., 23CS001"
                      />
                    </div>
                    <div>
                      <label className="label">Password *</label>
                      <input
                        type="password"
                        className="input"
                        value={studentForm.password}
                        onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Name</label>
                      <input
                        className="input"
                        value={studentForm.name}
                        onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Enrollment *</label>
                      <input
                        className="input"
                        value={studentForm.enrollment}
                        onChange={(e) => setStudentForm({ ...studentForm, enrollment: e.target.value })}
                        placeholder="e.g., 23CS001"
                      />
                    </div>
                    <div>
                      <label className="label">Email *</label>
                      <input
                        type="email"
                        className="input"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Mobile *</label>
                      <input
                        className="input"
                        value={studentForm.mobile}
                        onChange={(e) => setStudentForm({ ...studentForm, mobile: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Branch *</label>
                      <input
                        className="input"
                        value={studentForm.branch}
                        onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                        placeholder="e.g., CSE, ECE, EE, ICSE"
                      />
                    </div>
                    <div>
                      <label className="label">CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={studentForm.cgpa}
                        onChange={(e) => setStudentForm({ ...studentForm, cgpa: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">X Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={studentForm.xPercentage}
                        onChange={(e) => setStudentForm({ ...studentForm, xPercentage: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">XII Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={studentForm.xiiPercentage}
                        onChange={(e) => setStudentForm({ ...studentForm, xiiPercentage: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Active Backlogs</label>
                      <input
                        type="number"
                        className="input"
                        value={studentForm.activeBacklogs}
                        onChange={(e) => setStudentForm({ ...studentForm, activeBacklogs: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="label">Dead Backlogs</label>
                      <input
                        type="number"
                        className="input"
                        value={studentForm.deadBacklogs}
                        onChange={(e) => setStudentForm({ ...studentForm, deadBacklogs: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="label">Placement Status</label>
                      <select
                        className="input"
                        value={studentForm.placementStatus}
                        onChange={(e) => setStudentForm({ ...studentForm, placementStatus: e.target.value })}
                      >
                        <option value="UNPLACED">Unplaced</option>
                        <option value="NORMAL_PLACED">Normal Placed</option>
                        <option value="STANDARD_PLACED">Standard Placed</option>
                        <option value="DREAM_PLACED">Dream Placed</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Has Year Gap</label>
                      <select
                        className="input"
                        value={studentForm.hasYearGap ? "true" : "false"}
                        onChange={(e) => setStudentForm({ ...studentForm, hasYearGap: e.target.value === "true" })}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                    {studentForm.hasYearGap && (
                      <div>
                        <label className="label">Year Gap Duration (years)</label>
                        <input
                          type="number"
                          className="input"
                          value={studentForm.yearGapDuration}
                          onChange={(e) => setStudentForm({ ...studentForm, yearGapDuration: e.target.value })}
                        />
                      </div>
                    )}
                    <div>
                      <label className="label">CV1 URL</label>
                      <input
                        className="input"
                        value={studentForm.cv1Url}
                        onChange={(e) => setStudentForm({ ...studentForm, cv1Url: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">CV2 URL</label>
                      <input
                        className="input"
                        value={studentForm.cv2Url}
                        onChange={(e) => setStudentForm({ ...studentForm, cv2Url: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">CV3 URL</label>
                      <input
                        className="input"
                        value={studentForm.cv3Url}
                        onChange={(e) => setStudentForm({ ...studentForm, cv3Url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 text-sm border-t pt-3">
                    <div>
                      <label className="label">TPO Name</label>
                      <input
                        className="input"
                        value={studentForm.tpoName}
                        onChange={(e) => setStudentForm({ ...studentForm, tpoName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">TPO Email</label>
                      <input
                        className="input"
                        value={studentForm.tpoEmail}
                        onChange={(e) => setStudentForm({ ...studentForm, tpoEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">TPO Mobile</label>
                      <input
                        className="input"
                        value={studentForm.tpoMobile}
                        onChange={(e) => setStudentForm({ ...studentForm, tpoMobile: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">TNP Name</label>
                      <input
                        className="input"
                        value={studentForm.tnpName}
                        onChange={(e) => setStudentForm({ ...studentForm, tnpName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">TNP Email</label>
                      <input
                        className="input"
                        value={studentForm.tnpEmail}
                        onChange={(e) => setStudentForm({ ...studentForm, tnpEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">TNP Mobile</label>
                      <input
                        className="input"
                        value={studentForm.tnpMobile}
                        onChange={(e) => setStudentForm({ ...studentForm, tnpMobile: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">IC Name</label>
                      <input
                        className="input"
                        value={studentForm.icName}
                        onChange={(e) => setStudentForm({ ...studentForm, icName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">IC Email</label>
                      <input
                        className="input"
                        value={studentForm.icEmail}
                        onChange={(e) => setStudentForm({ ...studentForm, icEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">IC Mobile</label>
                      <input
                        className="input"
                        value={studentForm.icMobile}
                        onChange={(e) => setStudentForm({ ...studentForm, icMobile: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary" onClick={createStudent}>
                      Save Student
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setStudentForm({
                          loginId: "",
                          password: "",
                          name: "",
                          email: "",
                          mobile: "",
                          enrollment: "",
                          branch: "",
                          cgpa: "",
                          xPercentage: "",
                          xiiPercentage: "",
                          activeBacklogs: 0,
                          deadBacklogs: 0,
                          placementStatus: "UNPLACED",
                          hasYearGap: false,
                          yearGapDuration: "",
                          cv1Url: "",
                          cv2Url: "",
                          cv3Url: "",
                          tpoName: "",
                          tpoEmail: "",
                          tpoMobile: "",
                          tnpName: "",
                          tnpEmail: "",
                          tnpMobile: "",
                          icName: "",
                          icEmail: "",
                          icMobile: "",
                        });
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    * Required fields. If enrollment already exists, student will be updated.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Create / Update Users</h3>
            <div className="grid md:grid-cols-4 gap-2">
              <input className="input" placeholder="loginId" value={userForm.loginId} onChange={(e) => setUserForm({ ...userForm, loginId: e.target.value })} />
              <input className="input" placeholder="password" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
              <select className="input" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                <option value="COORDINATOR">Coordinator</option>
                <option value="CCD_MEMBER">CCD Member</option>
              </select>
              <button className="btn-primary" onClick={createUser}>Save</button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Password will be securely hashed on the server.
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Lock / Unlock Student</h3>
            <div className="mb-3 p-2 bg-slate-50 rounded text-sm">
              <strong>Locked Students:</strong> {stats.lockedStudentsCount}
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="input flex-1 min-w-[200px]"
                placeholder="Enter enrollment number (e.g., 23CS001)"
                value={lockEnrollment}
                onChange={(e) => setLockEnrollment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && lockEnrollment.trim()) {
                    lockStudent();
                  }
                }}
                autoComplete="off"
              />
              <select
                className="input flex-1 min-w-[150px]"
                value={lockValue ? "true" : "false"}
                onChange={(e) => setLockValue(e.target.value === "true")}
              >
                <option value="false">Unlock</option>
                <option value="true">Lock</option>
              </select>
              <button 
                className="btn-primary whitespace-nowrap" 
                onClick={lockStudent}
                disabled={!lockEnrollment.trim()}
              >
                Update
              </button>
            </div>
            <div className="mb-2">
              <button
                className="btn-secondary text-xs"
                onClick={fetchLockedStudents}
                title="Show all locked students with their enrollments"
              >
                {showLockedList ? "Hide" : "Show"} All Locked Students
              </button>
            </div>
            {showLockedList && lockedStudentsList.length > 0 && (
              <div className="mb-3 p-3 bg-red-50 rounded border border-red-200 max-h-48 overflow-y-auto">
                <div className="text-xs font-semibold mb-2 text-red-700">
                  Locked Students ({lockedStudentsList.length}):
                </div>
                <div className="space-y-1 text-xs">
                  {lockedStudentsList.map((student) => (
                    <div
                      key={student.userId}
                      className="flex justify-between items-center p-1 hover:bg-red-100 rounded"
                    >
                      <span>
                        <strong>{student.enrollment}</strong> | {student.branch} | {student.email} | ID: {student.userId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showLockedList && lockedStudentsList.length === 0 && (
              <div className="mb-3 p-3 bg-green-50 rounded border border-green-200 text-xs text-green-700">
                No locked students found.
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Locked students cannot apply to opportunities
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">View / Edit Student Profile</h3>
            <div className="mb-3">
              <div className="flex gap-2 mb-2">
                <input
                  className="input flex-1"
                  placeholder="Enter enrollment number (e.g., 23CS001)"
                  value={profileSearch.value}
                  onChange={(e) => setProfileSearch({ ...profileSearch, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && profileSearch.value.trim()) {
                      loadProfile();
                    }
                  }}
                />
                <button 
                  className="btn-secondary" 
                  onClick={loadProfile}
                  disabled={!profileSearch.value.trim()}
                >
                  Load
                </button>
                <button className="btn-primary" onClick={saveProfile} disabled={!profile}>
                  Save
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  className="btn-secondary text-xs"
                  onClick={fetchStudentsList}
                  title="View all students with their enrollment numbers"
                >
                  {showStudentsList ? "Hide" : "Show"} Students List
                </button>
                <span className="text-xs text-slate-500">
                  Search by enrollment number (default)
                </span>
              </div>
            </div>
            {showStudentsList && studentsList.length > 0 && (
              <div className="mb-3 p-3 bg-slate-50 rounded border max-h-48 overflow-y-auto">
                <div className="text-xs font-semibold mb-2">All Students (click to use enrollment):</div>
                <div className="space-y-1 text-xs">
                  {studentsList.map((student) => (
                    <div
                      key={student.userId}
                      className="flex justify-between items-center p-1 hover:bg-slate-200 rounded cursor-pointer"
                      onClick={() => {
                        setProfileSearch({ type: "enrollment", value: student.enrollment });
                        setShowStudentsList(false);
                      }}
                    >
                      <span>
                        <strong>{student.enrollment}</strong> | {student.branch} | {student.email} | ID: {student.userId}
                      </span>
                      {student.isLocked && <span className="text-red-600 text-xs">🔒 Locked</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {profile ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="label">Name</label>
                    <input
                      className="input"
                      value={profile.name || ""}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      className="input"
                      value={profile.email || ""}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Mobile</label>
                    <input
                      className="input"
                      value={profile.mobile || ""}
                      onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Enrollment</label>
                    <input
                      className="input bg-slate-100"
                      value={profile.enrollment || ""}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="label">Branch</label>
                    <input
                      className="input"
                      value={profile.branch || ""}
                      onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={profile.cgpa || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, cgpa: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">X Percentage</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={profile.xPercentage || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, xPercentage: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">XII Percentage</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={profile.xiiPercentage || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, xiiPercentage: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Active Backlogs</label>
                    <input
                      type="number"
                      className="input"
                      value={profile.activeBacklogs || 0}
                      onChange={(e) =>
                        setProfile({ ...profile, activeBacklogs: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Dead Backlogs</label>
                    <input
                      type="number"
                      className="input"
                      value={profile.deadBacklogs || 0}
                      onChange={(e) =>
                        setProfile({ ...profile, deadBacklogs: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Placement Status</label>
                    <select
                      className="input"
                      value={profile.placementStatus}
                      onChange={(e) => setProfile({ ...profile, placementStatus: e.target.value })}
                    >
                      <option value="DREAM_PLACED">Dream Placed</option>
                      <option value="STANDARD_PLACED">Standard Placed</option>
                      <option value="NORMAL_PLACED">Normal Placed</option>
                      <option value="UNPLACED">Unplaced</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Has Year Gap</label>
                    <select
                      className="input"
                      value={profile.hasYearGap ? "true" : "false"}
                      onChange={(e) => setProfile({ ...profile, hasYearGap: e.target.value === "true" })}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  {profile.hasYearGap && (
                    <div>
                      <label className="label">Year Gap Duration (years)</label>
                      <input
                        type="number"
                        className="input"
                        value={profile.yearGapDuration || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, yearGapDuration: e.target.value ? Number(e.target.value) : null })
                        }
                      />
                    </div>
                  )}
                  <div>
                    <label className="label">CV1 URL</label>
                    <input
                      className="input"
                      value={profile.cv1Url || ""}
                      onChange={(e) => setProfile({ ...profile, cv1Url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">CV2 URL</label>
                    <input
                      className="input"
                      value={profile.cv2Url || ""}
                      onChange={(e) => setProfile({ ...profile, cv2Url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">CV3 URL</label>
                    <input
                      className="input"
                      value={profile.cv3Url || ""}
                      onChange={(e) => setProfile({ ...profile, cv3Url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-3 text-sm border-t pt-3">
                  <div>
                    <label className="label">TPO Name</label>
                    <input
                      className="input"
                      value={profile.tpoName || ""}
                      onChange={(e) => setProfile({ ...profile, tpoName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">TPO Email</label>
                    <input
                      className="input"
                      value={profile.tpoEmail || ""}
                      onChange={(e) => setProfile({ ...profile, tpoEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">TPO Mobile</label>
                    <input
                      className="input"
                      value={profile.tpoMobile || ""}
                      onChange={(e) => setProfile({ ...profile, tpoMobile: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-3 text-sm border-t pt-3">
                  <div>
                    <label className="label">TNP Name</label>
                    <input
                      className="input"
                      value={profile.tnpName || ""}
                      onChange={(e) => setProfile({ ...profile, tnpName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">TNP Email</label>
                    <input
                      className="input"
                      value={profile.tnpEmail || ""}
                      onChange={(e) => setProfile({ ...profile, tnpEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">TNP Mobile</label>
                    <input
                      className="input"
                      value={profile.tnpMobile || ""}
                      onChange={(e) => setProfile({ ...profile, tnpMobile: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-3 text-sm border-t pt-3">
                  <div>
                    <label className="label">IC Name</label>
                    <input
                      className="input"
                      value={profile.icName || ""}
                      onChange={(e) => setProfile({ ...profile, icName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">IC Email</label>
                    <input
                      className="input"
                      value={profile.icEmail || ""}
                      onChange={(e) => setProfile({ ...profile, icEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">IC Mobile</label>
                    <input
                      className="input"
                      value={profile.icMobile || ""}
                      onChange={(e) => setProfile({ ...profile, icMobile: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Enter an enrollment number and click Load to edit profile.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}







