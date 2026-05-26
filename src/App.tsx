import { useState, useEffect } from "react";
import { Meeting, CallNote } from "./types";
import MeetingDashboard from "./components/MeetingDashboard";
import ActiveCallSimulator from "./components/ActiveCallSimulator";
import VoiceCloneLab from "./components/VoiceCloneLab";
import KnowledgeBaseForm from "./components/KnowledgeBaseForm";
import NotesHistory from "./components/NotesHistory";
import { initAuth, googleSignIn, logout } from "./lib/firebase-auth";
import { Mic, BookOpen, FileText, Calendar, Sparkles, AlertCircle, Headphones, Lock, ShieldCheck, ArrowRight, Loader2, Play } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "voice" | "qa" | "history">("dashboard");
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);

  // Authentication & Welcome Gating state
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [bypassWelcome, setBypassWelcome] = useState<boolean>(() => {
    return localStorage.getItem("voice_agent_bypass_welcome") === "true";
  });

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, cachedToken) => {
        setUser(currentUser);
        setToken(cachedToken);
        setNeedsAuth(false);
        setAuthLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
        setAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        setBypassWelcome(true);
        localStorage.setItem("voice_agent_bypass_welcome", "true");
      }
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setBypassWelcome(false);
    localStorage.removeItem("voice_agent_bypass_welcome");
  };

  const handleDemoMode = () => {
    setBypassWelcome(true);
    localStorage.setItem("voice_agent_bypass_welcome", "true");
  };

  // Quick navigation setup
  const tabs = [
    { id: "dashboard", label: "Meeting Delegation Center", icon: Calendar },
    { id: "voice", label: "Voice Training Lab", icon: Mic },
    { id: "qa", label: "Q&A Training Sheet", icon: BookOpen },
    { id: "history", label: "Call Notes & Task History", icon: FileText },
  ] as const;

  const handleSelectMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsLiveCallActive(true);
  };

  const handleCallEnded = (notes: CallNote) => {
    setIsLiveCallActive(false);
    setSelectedMeeting(null);
    // Switch to notes history automatically so user can inspect tasks
    setActiveTab("history");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans border-t-4 border-indigo-600">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold text-slate-500 font-mono">Initializing STANDLEY Agent Sync Core...</span>
        </div>
      </div>
    );
  }

  if (!user && !bypassWelcome) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans border-t-4 border-indigo-600">
        {/* Header decoration */}
        <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm ring-1 ring-indigo-500">
              <Mic className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                Voice Delegate AI Agent
                <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded font-mono text-[8px] text-indigo-600 uppercase tracking-widest font-bold">
                  STANDLEY v1.2
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure Client Link Active</span>
          </div>
        </header>

        {/* Hero Landing */}
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 md:py-16 flex flex-col items-center justify-center text-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full font-sans text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Verified Production Ready Security Gating
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl leading-none">
              Deploy Your Virtual <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">Voice Sync Representative</span>
            </h2>
            <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
              When meeting lineups clash or tasks take you away, let your secure, knowledge-calibrated delegate join alignments, speak back precise status answers, and deliver action items.
            </p>
          </div>

          {/* Grid of features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 h-fit">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Google Calendar Sync</h4>
                <p className="text-xs text-slate-500 leading-normal">OAuth-secured dynamic sync with Google Calendar API to automatically schedule virtual call bridges.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 h-fit">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Voice Signature Lab</h4>
                <p className="text-xs text-slate-500 leading-normal">Biometric voice calibration using local verification recordings. Auto-configures pitch, signature, and cadence.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex gap-3">
              <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600 h-fit">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Dynamic QA Sheets</h4>
                <p className="text-xs text-slate-500 leading-normal">Feed standup instructions into localized databases so the simulator answers teammates accurately when called.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 h-fit">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Action Notes History</h4>
                <p className="text-xs text-slate-500 leading-normal">Maintains transcripts locally, processes action checklists, and aggregates daily summaries via Gemini models.</p>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-md shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Choose Workspace Access Mode</h3>
            <p className="text-xs text-slate-500">
              Authorized sign in is required to sync your direct meetings agenda. For rapid, credentials-free evaluation, use the preloaded demo sandbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                id="gating-google-login-btn"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.89 5.89 0 018 12.629a5.89 5.89 0 015.991-5.89 5.753 5.753 0 014.07 1.621l3.142-3.142C19.23 3.32 16.81 2 13.99 2 8.471 2 4 6.47 4 11.99c0 5.518 4.471 9.99 9.991 9.99 6.24 0 9.71-4.381 9.71-9.805 0-.648-.057-1.181-.171-1.89H12.24z"/>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>

              <button
                id="gating-demo-sandbox-btn"
                onClick={handleDemoMode}
                className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                Explore Sandbox <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-mono">
              <Lock className="w-3 h-3 text-emerald-500" /> API key secrets never exposed to browser clients.
            </div>
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-white py-5 px-6 text-center text-xs text-slate-500 font-mono">
          Made for Google AI Studio applets. Sandbox mode does not require Google API credentials.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans border-t-4 border-indigo-600">
      
      {/* Visual Header Grid */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-sm ring-1 ring-indigo-500">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Voice Delegate AI Agent
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded font-mono text-[9px] text-indigo-600 uppercase tracking-widest font-bold">
                STANDLEY v1.2
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Autonomously join, speak on your behalf, and digest Google Calendar standup notes
            </p>
          </div>
        </div>

        {/* Global indicator/user state */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              <span>Synced: {user.displayName || user.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-[10px] text-slate-700">Agent Sync Lines Online</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Sandbox alert strip */}
        {!isLiveCallActive && !user && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-900">Running in Demo Sandbox Mode</p>
                <p className="text-[10px] text-indigo-600 font-medium">Using simulated preseeded daily engineering syncs. Authenticate with Google to fetch direct events.</p>
              </div>
            </div>
            <button
              id="sandbox-connect-btn"
              onClick={handleLogin}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
            >
              Connect Google Calendar
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        {!isLiveCallActive && (
          <nav id="navbar-nav" className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 shadow-sm"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Dynamic Context Render Stack */}
        <div className="flex-1">
          {isLiveCallActive && selectedMeeting ? (
            /* Immersive full interface for delegating meeting simulation */
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <AlertCircle className="w-4 h-4 text-indigo-600" />
                  <span>
                    Currently Simulating Call Bridge delegation for:{" "}
                    <strong className="text-slate-800">"{selectedMeeting.summary}"</strong>
                  </span>
                </div>
                <button
                  id="abort-call-btn"
                  onClick={() => {
                    setIsLiveCallActive(false);
                    setSelectedMeeting(null);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-lg border border-slate-200 shadow-sm transition-all cursor-pointer"
                >
                  Cancel Call Sync
                </button>
              </div>

              <ActiveCallSimulator
                meeting={selectedMeeting}
                onCallEnded={handleCallEnded}
              />
            </div>
          ) : (
            /* Standing Hub Views */
            <>
              {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Calendar schedules trigger list */}
                  <div className="md:col-span-8">
                    <MeetingDashboard
                      onSelectMeeting={handleSelectMeeting}
                      activeMeetingId={selectedMeeting?.id}
                      user={user}
                      token={token}
                      needsAuth={needsAuth}
                      onLogin={handleLogin}
                      onLogout={handleLogout}
                    />
                  </div>

                  {/* Right quick starter tips pane */}
                  <div className="md:col-span-4 space-y-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                      <h4 className="text-sm font-bold text-slate-800 mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" /> Quick Implementation Blueprint
                      </h4>
                      <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed font-sans">
                        <p>
                          This assistant replaces Varad during standard aligned dial-in videoconferences:
                        </p>
                        <ol className="list-decimal pl-4 space-y-2">
                          <li>
                            <strong>Enroll:</strong> Navigate to <span className="text-indigo-600 font-semibold cursor-pointer" onClick={() => setActiveTab("voice")}>Voice Training Lab</span>, record 3 verification sentences to map pitch/tempo signatures.
                          </li>
                          <li>
                            <strong>Calibrate Knowledge:</strong> Fill answers to standup questions in <span className="text-indigo-600 font-semibold cursor-pointer" onClick={() => setActiveTab("qa")}>Q&A Training Sheet</span>.
                          </li>
                          <li>
                            <strong>Delegate Call:</strong> Click a calendar meeting start button, dial-in the voice client, trigger questions and review matching synthesis workflows.
                          </li>
                          <li>
                            <strong>Retrieve Deliverables:</strong> Close calls to trigger automated transcript summaries via <code>gemini-3.5-flash</code> in <span className="text-green-600 font-semibold cursor-pointer" onClick={() => setActiveTab("history")}>Call Notes</span>.
                          </li>
                        </ol>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                        <Headphones className="w-4 h-4 text-indigo-600" /> System Features Compliances
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">
                        Designed to run full-stack Express parameters with safe Node bundling. All Gemini calls proxy completely through server endpoints to safeguard private user tokens fully.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "voice" && <VoiceCloneLab />}

              {activeTab === "qa" && <KnowledgeBaseForm />}

              {activeTab === "history" && <NotesHistory />}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 px-6 text-center text-xs text-slate-500 font-mono mt-8">
        Made for Google AI Studio applets. Uses Gemini-3.5-flash summaries & Gemini TTS sound synthesis.
      </footer>
    </div>
  );
}
