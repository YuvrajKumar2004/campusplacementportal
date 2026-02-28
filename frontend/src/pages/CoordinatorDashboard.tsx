import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import { api } from "../lib/api";

interface Props {
  onLogout: () => void;
}

const defaultShared = [
  "email",
  "mobile",
  "enrollment",
  "branch",
  "cgpa",
  "xPercentage",
  "xiiPercentage",
  "activeBacklogs",
  "deadBacklogs",
  "cv1Url",
];

export default function CoordinatorDashboard({ onLogout }: Props) {
  const [posts, setPosts] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    category: "ON_CAMPUS",
    companyName: "",
    jobRole: "",
    tier: "NORMAL",
    stipendCtc: "",
    eligibilityEnrollmentPrefix: "23",
    eligibilityXPercent: 0,
    eligibilityXiPercent: 0,
    eligibilityActiveBacklogs: 0,
    eligibilityDeadBacklogs: 0,
    eligibilityCgpa: 0,
    eligibilityBranch: "",
    eligibilityMaxGapYears: "",
    deadline: "",
    skills: "",
    otherDetails: "",
    sharedFields: defaultShared,
  });
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [exportRows, setExportRows] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<Set<number>>(new Set());
  const [rounds, setRounds] = useState<any[]>([]);
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [emailNotification, setEmailNotification] = useState(false);
  const [newRound, setNewRound] = useState({
    roundNumber: 1,
    description: "",
    date: "",
    centre: "",
    time: "",
  });

  const fetchPosts = async () => {
    const res = await api.get("/coordinator/posts");
    setPosts(res.data);
  };

  useEffect(() => {
    fetchPosts().catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      if (selectedPost) {
        await api.put(`/coordinator/posts/${selectedPost}`, form);
        setMessage("Post updated");
      } else {
        await api.post("/coordinator/posts", form);
        setMessage("Post created");
      }
      fetchPosts();
      setSelectedPost(null);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Create failed");
    }
  };

  const loadApplications = async (id: number) => {
    const res = await api.get(`/coordinator/posts/${id}/applications`);
    setSelectedPost(id);
    setApplications(res.data.applications);
    setExportRows(res.data.exportRows);
    setSelectedApplications(new Set());
    
    // Load rounds for this opportunity
    try {
      const roundsRes = await api.get(`/coordinator/posts/${id}/rounds`);
      setRounds(roundsRes.data);
      // Set next round number
      if (roundsRes.data.length > 0) {
        const maxRound = Math.max(...roundsRes.data.map((r: any) => r.roundNumber));
        setNewRound({ ...newRound, roundNumber: maxRound + 1 });
      }
    } catch (err) {
      setRounds([]);
    }
  };

  const handleRoundUpdate = async (roundNumber: number, description: string, date: string, centre: string, time: string, results: { applicationId: number; status: string }[]) => {
    if (!selectedPost) return;
    try {
      await api.post(`/coordinator/posts/${selectedPost}/rounds`, {
        roundNumber,
        description,
        date,
        centre,
        time,
        results,
      });
      setMessage(`Round ${roundNumber} updated successfully`);
      loadApplications(selectedPost);
      setSelectedApplications(new Set());
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Round update failed");
    }
  };

  const handleCreateNewRound = () => {
    if (selectedApplications.size === 0) {
      setMessage("Please select at least one student for the next round");
      return;
    }
    // Calculate next round number
    if (rounds.length > 0) {
      const maxRound = Math.max(...rounds.map((r: any) => r.roundNumber));
      setNewRound({ ...newRound, roundNumber: maxRound + 1 });
    } else {
      setNewRound({ ...newRound, roundNumber: 1 });
    }
    setShowRoundModal(true);
  };

  const handleToggleApplication = (applicationId: number) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedApplications.size === applications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(applications.map((a) => a.id)));
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-4">
      <TopBar title="Coordinator Dashboard" onLogout={onLogout} />
      {message && <div className="text-sm text-blue-700">{message}</div>}

      <div className="card">
        <h3 className="font-semibold mb-2">New Post</h3>
        <form className="grid md:grid-cols-2 gap-3" onSubmit={handleSubmit}>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="ON_CAMPUS">On-Campus</option>
              <option value="OFF_CAMPUS">Off-Campus / Hackathon</option>
            </select>
          </div>
          <div>
            <label className="label">Company</label>
            <input className="input" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          </div>
          <div>
            <label className="label">Job Role</label>
            <input className="input" value={form.jobRole} onChange={(e) => setForm({ ...form, jobRole: e.target.value })} required />
          </div>
          <div>
            <label className="label">Tier</label>
            <select className="input" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
              <option value="DREAM">Dream</option>
              <option value="STANDARD">Standard</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
          <div>
            <label className="label">CTC / Stipend</label>
            <input className="input" value={form.stipendCtc} onChange={(e) => setForm({ ...form, stipendCtc: e.target.value })} />
          </div>
          <div>
            <label className="label">Deadline</label>
            <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <label className="label">Skills</label>
            <input className="input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          </div>
          <div>
            <label className="label">Other Details</label>
            <input className="input" value={form.otherDetails} onChange={(e) => setForm({ ...form, otherDetails: e.target.value })} />
          </div>
          <div>
            <label className="label">Eligibility Enrollment Prefix</label>
            <input className="input" value={form.eligibilityEnrollmentPrefix} onChange={(e) => setForm({ ...form, eligibilityEnrollmentPrefix: e.target.value })} />
          </div>
          <div>
            <label className="label">X % min</label>
            <input type="number" className="input" value={form.eligibilityXPercent} onChange={(e) => setForm({ ...form, eligibilityXPercent: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">XII % min</label>
            <input type="number" className="input" value={form.eligibilityXiPercent} onChange={(e) => setForm({ ...form, eligibilityXiPercent: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">CGPA min</label>
            <input type="number" className="input" value={form.eligibilityCgpa} onChange={(e) => setForm({ ...form, eligibilityCgpa: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Active backlogs max</label>
            <input type="number" className="input" value={form.eligibilityActiveBacklogs} onChange={(e) => setForm({ ...form, eligibilityActiveBacklogs: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Dead backlogs max</label>
            <input type="number" className="input" value={form.eligibilityDeadBacklogs} onChange={(e) => setForm({ ...form, eligibilityDeadBacklogs: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Branch eligibility (comma-separated, e.g. CSE,ECE,EE or blank for all)</label>
            <input
              className="input"
              value={form.eligibilityBranch}
              onChange={(e) => setForm({ ...form, eligibilityBranch: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Max gap years allowed (blank for no check)</label>
            <input
              type="number"
              className="input"
              value={form.eligibilityMaxGapYears}
              onChange={(e) =>
                setForm({ ...form, eligibilityMaxGapYears: e.target.value === "" ? "" : Number(e.target.value) })
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Shared fields with company</label>
            <div className="flex flex-wrap gap-2">
              {defaultShared.map((f) => (
                <label key={f} className="flex items-center gap-1 text-xs border rounded px-2 py-1">
                  <input
                    type="checkbox"
                    checked={form.sharedFields.includes(f)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, sharedFields: [...form.sharedFields, f] });
                      } else {
                        setForm({ ...form, sharedFields: form.sharedFields.filter((x: string) => x !== f) });
                      }
                    }}
                  />
                  {f}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary">Post</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">My Posts</h3>
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="border rounded p-3">
              <div className="font-medium">{p.companyName} — {p.jobRole}</div>
              <div className="text-xs text-slate-500">Category: {p.category} | Tier: {p.tier}</div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <button className="btn-secondary" onClick={() => loadApplications(p.id)}>
                  View Applications
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    // Prefill form for editing
                    setForm({
                      ...form,
                      ...p,
                      deadline: p.deadline ? p.deadline.slice(0, 10) : "",
                    });
                    setSelectedPost(p.id);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn-primary"
                  onClick={async () => {
                    // fetch CSV with auth token
                    const res = await api.get(`/coordinator/posts/${p.id}/export`, {
                      responseType: "blob",
                    });
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", `opportunity-${p.id}-applications.csv`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  Export CSV
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <div className="text-sm text-slate-500">No posts yet.</div>}
        </div>
      </div>

      {selectedPost && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Applications for post #{selectedPost}</h3>
            <button 
              className="btn-primary" 
              onClick={handleCreateNewRound}
              disabled={selectedApplications.size === 0}
            >
              + Add New Round
            </button>
          </div>

          {/* Rounds List */}
          {rounds.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2">Rounds:</h4>
              <div className="space-y-2">
                {rounds.map((round) => (
                  <div key={round.roundNumber} className="border rounded p-3 bg-slate-50">
                    <div className="font-medium text-sm">Round {round.roundNumber}</div>
                    {round.description && (
                      <div className="text-xs text-slate-600 mt-1">Description: {round.description}</div>
                    )}
                    {round.date && (
                      <div className="text-xs text-slate-600">Date: {typeof round.date === 'string' ? new Date(round.date).toLocaleDateString() : round.date.toLocaleDateString()}</div>
                    )}
                    {round.centre && (
                      <div className="text-xs text-slate-600">Centre: {round.centre}</div>
                    )}
                    {round.time && (
                      <div className="text-xs text-slate-600">Time: {round.time}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Round Modal Popup */}
          {showRoundModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Add Students to Next Round</h3>
                  <button
                    onClick={() => {
                      setShowRoundModal(false);
                      setEmailNotification(false);
                    }}
                    className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* Selected Students Info */}
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Selected Students: {selectedApplications.size}
                  </p>
                  <div className="text-xs text-blue-700">
                    {applications
                      .filter((a) => selectedApplications.has(a.id))
                      .map((a) => `${a.student.enrollment} (${a.student.branch})`)
                      .join(", ")}
                  </div>
                </div>

                {/* Email Notification Toggle */}
                <div className="mb-4 p-4 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Email Notification</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEmailNotification(!emailNotification)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          emailNotification ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            emailNotification ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-sm text-slate-600 font-medium">{emailNotification ? "ON" : "OFF"}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">(Using Gmail API for sending emails)</p>
                </div>

                {/* Round Details Form */}
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-3 text-slate-700">Round Details</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Round Number</label>
                      <input
                        type="number"
                        className="input"
                        value={newRound.roundNumber}
                        onChange={(e) => setNewRound({ ...newRound, roundNumber: Number(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="label">Description</label>
                      <input
                        className="input"
                        value={newRound.description}
                        onChange={(e) => setNewRound({ ...newRound, description: e.target.value })}
                        placeholder="e.g., Technical Interview"
                      />
                    </div>
                    <div>
                      <label className="label">Date</label>
                      <input
                        type="date"
                        className="input"
                        value={newRound.date}
                        onChange={(e) => setNewRound({ ...newRound, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Centre</label>
                      <input
                        className="input"
                        value={newRound.centre}
                        onChange={(e) => setNewRound({ ...newRound, centre: e.target.value })}
                        placeholder="e.g., Room 101"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Time</label>
                      <input
                        className="input"
                        value={newRound.time}
                        onChange={(e) => setNewRound({ ...newRound, time: e.target.value })}
                        placeholder="e.g., 10:00 AM"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowRoundModal(false);
                      setEmailNotification(false);
                      setNewRound({ roundNumber: newRound.roundNumber, description: "", date: "", centre: "", time: "" });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-secondary bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => {
                      handleRoundUpdate(
                        newRound.roundNumber,
                        newRound.description,
                        newRound.date,
                        newRound.centre,
                        newRound.time,
                        Array.from(selectedApplications).map((id) => ({
                          applicationId: id,
                          status: "REJECTED",
                        }))
                      );
                      setShowRoundModal(false);
                      setEmailNotification(false);
                      setSelectedApplications(new Set());
                      setNewRound({ roundNumber: newRound.roundNumber + 1, description: "", date: "", centre: "", time: "" });
                    }}
                  >
                    Mark as REJECTED
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      handleRoundUpdate(
                        newRound.roundNumber,
                        newRound.description,
                        newRound.date,
                        newRound.centre,
                        newRound.time,
                        Array.from(selectedApplications).map((id) => ({
                          applicationId: id,
                          status: "SELECTED",
                        }))
                      );
                      setShowRoundModal(false);
                      setEmailNotification(false);
                      setSelectedApplications(new Set());
                      setNewRound({ roundNumber: newRound.roundNumber + 1, description: "", date: "", centre: "", time: "" });
                    }}
                  >
                    Mark as SELECTED
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Applications List with Checkboxes */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm">Applied Students ({applications.length})</h4>
              <button className="btn-secondary text-xs" onClick={handleSelectAll}>
                {selectedApplications.size === applications.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {applications.map((a) => {
                const hasRounds = a.rounds && a.rounds.length > 0;
                const latestRound = hasRounds ? a.rounds[a.rounds.length - 1] : null;
                return (
                  <div key={a.id} className="border rounded p-2 text-sm">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedApplications.has(a.id)}
                        onChange={() => handleToggleApplication(a.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{a.student.enrollment} ({a.student.branch})</div>
                        <div className="text-xs text-slate-600">Selected CV: {a.selectedCv}</div>
                        {latestRound && (
                          <div className="text-xs text-blue-600 mt-1">
                            Latest: Round {latestRound.roundNumber} - {latestRound.status || "PENDING"}
                            {latestRound.description && ` (${latestRound.description})`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions for Existing Rounds */}
          {rounds.length > 0 && selectedApplications.size > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">Mark Selected for Existing Round:</h4>
              <div className="flex flex-wrap gap-2">
                {rounds.map((round) => (
                  <div key={round.roundNumber} className="flex gap-2">
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => {
                        const roundDate = round.date ? (typeof round.date === 'string' ? round.date : new Date(round.date).toISOString().split('T')[0]) : "";
                        handleRoundUpdate(
                          round.roundNumber,
                          round.description || "",
                          roundDate,
                          round.centre || "",
                          round.time || "",
                          Array.from(selectedApplications).map((id) => ({
                            applicationId: id,
                            status: "SELECTED",
                          }))
                        );
                      }}
                    >
                      SELECTED (R{round.roundNumber})
                    </button>
                    <button
                      className="btn-secondary text-xs bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => {
                        const roundDate = round.date ? (typeof round.date === 'string' ? round.date : new Date(round.date).toISOString().split('T')[0]) : "";
                        handleRoundUpdate(
                          round.roundNumber,
                          round.description || "",
                          roundDate,
                          round.centre || "",
                          round.time || "",
                          Array.from(selectedApplications).map((id) => ({
                            applicationId: id,
                            status: "REJECTED",
                          }))
                        );
                      }}
                    >
                      REJECTED (R{round.roundNumber})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-slate-600">Export preview rows: {exportRows.length}</div>
        </div>
      )}
    </div>
  );
}


