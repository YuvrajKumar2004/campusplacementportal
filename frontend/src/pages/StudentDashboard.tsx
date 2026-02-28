import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import { api } from "../lib/api";

interface Props {
  onLogout: () => void;
}

type Opportunity = any;

export default function StudentDashboard({ onLogout }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [onCampus, setOnCampus] = useState<Opportunity[]>([]);
  const [offCampus, setOffCampus] = useState<Opportunity[]>([]);
  const [applied, setApplied] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cvChoice, setCvChoice] = useState<"cv1Url" | "cv2Url" | "cv3Url">("cv1Url");
  const [message, setMessage] = useState<string | null>(null);
  const [savingCv, setSavingCv] = useState(false);
  const [editingAppId, setEditingAppId] = useState<number | null>(null);
  const [editingCv, setEditingCv] = useState<"cv1Url" | "cv2Url" | "cv3Url">("cv1Url");
  const [atsScores, setAtsScores] = useState<Record<string, { score: number | null; error: string | null }>>({});

  const fetchAll = async () => {
    const [p, on, off, apps, notes] = await Promise.all([
      api.get("/student/me"),
      api.get("/student/opportunities/on-campus"),
      api.get("/student/opportunities/off-campus"),
      api.get("/student/applied"),
      api.get("/student/notifications"),
    ]);
    setProfile(p.data);
    setOnCampus(on.data);
    setOffCampus(off.data);
    setApplied(apps.data);
    setNotifications(notes.data);
  };

  useEffect(() => {
    fetchAll().catch(console.error);
  }, []);

  const handleApply = async (opportunityId: number) => {
    setMessage(null);
    try {
      await api.post("/student/apply", { opportunityId, selectedCv: cvChoice });
      setMessage("Applied successfully");
      fetchAll();
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Apply failed");
    }
  };

  const handleSaveCvs = async () => {
    if (!profile) return;
    setMessage(null);
    setSavingCv(true);
    try {
      const res = await api.put("/student/cv", {
        cv1Url: profile.cv1Url,
        cv2Url: profile.cv2Url,
        cv3Url: profile.cv3Url,
      });
      setProfile(res.data);
      setMessage("CV links updated");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to update CVs");
    } finally {
      setSavingCv(false);
    }
  };

  const handleUpdateApplication = async (applicationId: number) => {
    setMessage(null);
    try {
      await api.put(`/student/applied/${applicationId}`, { selectedCv: editingCv });
      setMessage("Application updated successfully");
      setEditingAppId(null);
      fetchAll();
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to update application");
    }
  };

  const canEditApplication = (app: any) => {
    if (!app.opportunity.deadline) return true;
    return new Date(app.opportunity.deadline) > new Date();
  };

  const getPlacementStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DREAM_PLACED: "bg-purple-100 text-purple-800",
      STANDARD_PLACED: "bg-blue-100 text-blue-800",
      NORMAL_PLACED: "bg-green-100 text-green-800",
      UNPLACED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.UNPLACED;
  };

  const handleGetAtsScore = (application: any) => {
    // application.selectedCv is already the CV URL value (not the field name)
    const cvUrl = application.selectedCv || "";
    
    // If score already exists for this CV link, don't regenerate
    if (atsScores[cvUrl]) {
      return;
    }
    
    // Check if CV link contains "drive.google.com" (not just /file)
    if (cvUrl && cvUrl.includes("drive.google.com")) {
      // Generate random number from 60 to 95
      const score = Math.floor(Math.random() * (95 - 60 + 1)) + 60;
      setAtsScores({
        ...atsScores,
        [cvUrl]: { score, error: null },
      });
    } else {
      setAtsScores({
        ...atsScores,
        [cvUrl]: { score: null, error: "Invalid link" },
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <TopBar title="Student Dashboard" onLogout={onLogout} />
        
        {message && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>{message}</span>
          </div>
        )}

        {/* Profile and CV Selection Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">Profile</h2>
            {profile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Name</span>
                    <span className="text-sm text-slate-900 font-medium">{profile.email?.split('@')[0] || '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</span>
                    <span className="text-sm text-slate-900 break-all">{profile.email || '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Mobile</span>
                    <span className="text-sm text-slate-900">{profile.mobile || '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Enrollment</span>
                    <span className="text-sm text-slate-900 font-semibold text-blue-600">{profile.enrollment || '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Branch</span>
                    <span className="text-sm text-slate-900">{profile.branch || '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">CGPA</span>
                    <span className="text-sm text-slate-900 font-semibold text-green-600">{profile.cgpa?.toFixed(2) || '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Placement Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${getPlacementStatusBadge(profile.placementStatus)}`}>
                      {profile.placementStatus?.replace('_', ' ') || '—'}
                    </span>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">CV Links (Editable)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">CV1 (Google Drive link)</label>
                      <input
                        className="input"
                        value={profile.cv1Url || ""}
                        onChange={(e) => setProfile({ ...profile, cv1Url: e.target.value })}
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">CV2 (Google Drive link)</label>
                      <input
                        className="input"
                        value={profile.cv2Url || ""}
                        onChange={(e) => setProfile({ ...profile, cv2Url: e.target.value })}
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">CV3 (Google Drive link)</label>
                      <input
                        className="input"
                        value={profile.cv3Url || ""}
                        onChange={(e) => setProfile({ ...profile, cv3Url: e.target.value })}
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                    <button
                      className="btn-primary w-full mt-1"
                      onClick={handleSaveCvs}
                      disabled={savingCv}
                    >
                      {savingCv ? "Saving..." : "Save CV Links"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 py-8 text-center">Loading profile...</div>
            )}
          </div>

          {/* CV Selection Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">CV Selection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select CV for Applications</label>
                <select
                  className="input"
                  value={cvChoice}
                  onChange={(e) => setCvChoice(e.target.value as any)}
                >
                  <option value="cv1Url">CV1</option>
                  <option value="cv2Url">CV2</option>
                  <option value="cv3Url">CV3</option>
                </select>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Note:</strong> Apply button enforces eligibility, deadlines, placement status, and lock checks.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* On-Campus Opportunities */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">On-Campus Opportunities</h2>
          <p className="text-sm text-slate-600 mb-4">Eligible opportunities only</p>
          <div className="space-y-4">
            {onCampus.map((o) => (
              <div key={o.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-slate-900 text-base mb-1">
                      {o.companyName} — {o.jobRole}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      o.tier === 'DREAM' ? 'bg-purple-100 text-purple-800' :
                      o.tier === 'STANDARD' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {o.tier || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-slate-600 space-y-1 mb-3">
                  {o.stipendCtc && <div><span className="font-medium">CTC/Stipend:</span> {o.stipendCtc}</div>}
                  {o.skills && <div><span className="font-medium">Skills:</span> {o.skills}</div>}
                  {o.deadline && <div><span className="font-medium">Deadline:</span> {new Date(o.deadline).toLocaleDateString()}</div>}
                </div>
                <button 
                  className="btn-primary w-full sm:w-auto" 
                  onClick={() => handleApply(o.id)}
                >
                  Apply
                </button>
              </div>
            ))}
            {onCampus.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-8">No eligible opportunities available.</div>
            )}
          </div>
        </div>

        {/* Off-Campus / Hackathons */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">Off-Campus / Hackathons</h2>
          <div className="space-y-4">
            {offCampus.map((o) => (
              <div key={o.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                <div className="font-semibold text-slate-900 text-base mb-2">
                  {o.companyName} — {o.jobRole}
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  {o.otherDetails && <div>{o.otherDetails}</div>}
                  {o.skills && <div><span className="font-medium">Skills:</span> {o.skills}</div>}
                  {o.stipendCtc && (
                    <div>
                      <a href={o.stipendCtc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium">
                        View Details →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {offCampus.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-8">No off-campus opportunities available.</div>
            )}
          </div>
        </div>

        {/* Applied Opportunities */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">Applied Opportunities</h2>
          <div className="space-y-4">
            {applied.map((a) => (
              <div key={a.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-base mb-1">
                      {a.opportunity.companyName} — {a.opportunity.jobRole}
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                      <span className="font-medium">Selected CV:</span> {a.selectedCv}
                    </div>
                    {a.opportunity.deadline && (
                      <div className="text-xs text-slate-500 mb-2">
                        Deadline: {new Date(a.opportunity.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* ATS Score Section */}
                <div className="mb-3 flex items-center gap-3">
                  <button
                    className="btn-secondary text-sm"
                    onClick={() => handleGetAtsScore(a)}
                  >
                    Get ATS Score
                  </button>
                  {atsScores[a.selectedCv || ""] && (
                    <div className="text-sm">
                      {atsScores[a.selectedCv || ""].score !== null ? (
                        <span className="font-semibold text-green-600">
                          ATS Score: {atsScores[a.selectedCv || ""].score}
                        </span>
                      ) : (
                        <span className="font-semibold text-red-600">
                          {atsScores[a.selectedCv || ""].error}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {editingAppId === a.id ? (
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Update CV Selection</label>
                      <select
                        className="input"
                        value={editingCv}
                        onChange={(e) => setEditingCv(e.target.value as any)}
                      >
                        <option value="cv1Url">CV1</option>
                        <option value="cv2Url">CV2</option>
                        <option value="cv3Url">CV3</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-primary flex-1"
                        onClick={() => handleUpdateApplication(a.id)}
                      >
                        Save Changes
                      </button>
                      <button
                        className="btn-secondary flex-1"
                        onClick={() => setEditingAppId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {canEditApplication(a) && (
                      <button
                        className="btn-secondary text-sm mb-3"
                        onClick={() => {
                          setEditingAppId(a.id);
                          setEditingCv(a.selectedCv as "cv1Url" | "cv2Url" | "cv3Url");
                        }}
                      >
                        Edit Application
                      </button>
                    )}
                    {a.rounds.length > 0 && (
                      <div className="pt-3 border-t border-slate-200">
                        <div className="text-sm font-semibold text-slate-700 mb-2">Round Status:</div>
                        <ul className="space-y-2">
                          {a.rounds.map((r: any) => (
                            <li key={r.id} className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Round {r.roundNumber}:</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  r.status === 'SELECTED' ? 'bg-green-100 text-green-800' :
                                  r.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {r.status || "PENDING"}
                                </span>
                                {r.date && (
                                  <span className="text-xs text-slate-500">
                                    ({new Date(r.date).toLocaleDateString()})
                                  </span>
                                )}
                              </div>
                              {r.description && (
                                <div className="text-xs text-slate-600 mt-1 ml-4">{r.description}</div>
                              )}
                              {r.centre && (
                                <div className="text-xs text-slate-600 mt-1 ml-4">Centre: {r.centre}</div>
                              )}
                              {r.time && (
                                <div className="text-xs text-slate-600 mt-1 ml-4">Time: {r.time}</div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {a.rounds.length === 0 && (
                      <div className="text-sm text-slate-500 pt-3 border-t border-slate-200">No rounds scheduled yet.</div>
                    )}
                  </>
                )}
              </div>
            ))}
            {applied.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-8">No applications submitted yet.</div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">Notifications</h2>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                <div className="font-semibold text-slate-900 text-sm mb-1">{n.title}</div>
                <div className="text-sm text-slate-600 mb-2">{n.body}</div>
                <div className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-8">No notifications available.</div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">Contact Information</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* TPO Contact */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 text-blue-600">TPO (Training & Placement Officer)</h3>
              {profile?.tpoName || profile?.tpoEmail || profile?.tpoMobile ? (
                <div className="space-y-2 text-sm">
                  {profile.tpoName && (
                    <div>
                      <span className="text-slate-500 font-medium">Name:</span>
                      <div className="text-slate-900">{profile.tpoName}</div>
                    </div>
                  )}
                  {profile.tpoEmail && (
                    <div>
                      <span className="text-slate-500 font-medium">Email:</span>
                      <div className="text-slate-900 break-all">{profile.tpoEmail}</div>
                    </div>
                  )}
                  {profile.tpoMobile && (
                    <div>
                      <span className="text-slate-500 font-medium">Mobile:</span>
                      <div className="text-slate-900">{profile.tpoMobile}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-500">Contact details not available</div>
              )}
            </div>

            {/* TnP Contact */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 text-blue-600">TnP (Training & Placement)</h3>
              {profile?.tnpName || profile?.tnpEmail || profile?.tnpMobile ? (
                <div className="space-y-2 text-sm">
                  {profile.tnpName && (
                    <div>
                      <span className="text-slate-500 font-medium">Name:</span>
                      <div className="text-slate-900">{profile.tnpName}</div>
                    </div>
                  )}
                  {profile.tnpEmail && (
                    <div>
                      <span className="text-slate-500 font-medium">Email:</span>
                      <div className="text-slate-900 break-all">{profile.tnpEmail}</div>
                    </div>
                  )}
                  {profile.tnpMobile && (
                    <div>
                      <span className="text-slate-500 font-medium">Mobile:</span>
                      <div className="text-slate-900">{profile.tnpMobile}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-500">Contact details not available</div>
              )}
            </div>

            {/* IC Contact */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 text-blue-600">IC (Internship Coordinator)</h3>
              {profile?.icName || profile?.icEmail || profile?.icMobile ? (
                <div className="space-y-2 text-sm">
                  {profile.icName && (
                    <div>
                      <span className="text-slate-500 font-medium">Name:</span>
                      <div className="text-slate-900">{profile.icName}</div>
                    </div>
                  )}
                  {profile.icEmail && (
                    <div>
                      <span className="text-slate-500 font-medium">Email:</span>
                      <div className="text-slate-900 break-all">{profile.icEmail}</div>
                    </div>
                  )}
                  {profile.icMobile && (
                    <div>
                      <span className="text-slate-500 font-medium">Mobile:</span>
                      <div className="text-slate-900">{profile.icMobile}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-500">Contact details not available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


