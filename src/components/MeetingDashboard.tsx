import { useState, useEffect } from "react";
import { Meeting } from "../types";
import { googleSignIn, initAuth, logout, getAccessToken } from "../lib/firebase-auth";
import { Calendar, User as UserIcon, RefreshCw, LogIn, LogOut, Clock, Link2, Bell, PlayCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MeetingDashboardProps {
  onSelectMeeting: (meeting: Meeting) => void;
  activeMeetingId?: string;
  user?: any;
  token?: string | null;
  needsAuth?: boolean;
  onLogin?: () => Promise<void>;
  onLogout?: () => Promise<void>;
}

export default function MeetingDashboard({
  onSelectMeeting,
  activeMeetingId,
  user,
  token,
  needsAuth,
  onLogin,
  onLogout,
}: MeetingDashboardProps) {
  const [localUser, setLocalUser] = useState<any>(null);
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [localNeedsAuth, setLocalNeedsAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showSimulated, setShowSimulated] = useState(true);

  const currentUser = user !== undefined ? user : localUser;
  const currentToken = token !== undefined ? token : localToken;
  const currentNeedsAuth = needsAuth !== undefined ? needsAuth : localNeedsAuth;

  // Load preseeded simulated meetings when not authenticated
  const simulatedMeetings: Meeting[] = [
    {
      id: "sim-meet-1",
      summary: "Daily Engineering Sync & standup",
      description: "Daily standup meeting to sync on core infrastructure, check dev server compilation parameters, and discuss database structures.",
      location: "Google Meet link (Simulated)",
      meetLink: "https://meet.google.com/abc-defg-hij",
      start: { dateTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString() },
      end: { dateTime: new Date(new Date().setHours(10, 30, 0, 0)).toISOString() },
      attendees: [
        { email: "justvarad@gmail.com", responseStatus: "accepted" },
        { email: "team-lead@tech.co", responseStatus: "accepted" },
        { email: "scrum-master@tech.co", responseStatus: "needsAction" }
      ],
      isSimulated: true
    },
    {
      id: "sim-meet-2",
      summary: "QA Verification & Release Alignment",
      description: "Review automated testing reports, assess typescript type-safety, and verify esbuild single-file script compiling parameters.",
      location: "Google Meet link (Simulated)",
      meetLink: "https://meet.google.com/xyz-lmn-pqr",
      start: { dateTime: new Date(new Date().setHours(14, 0, 0, 0)).toISOString() },
      end: { dateTime: new Date(new Date().setHours(15, 0, 0, 0)).toISOString() },
      attendees: [
        { email: "justvarad@gmail.com", responseStatus: "accepted" },
        { email: "qa-champion@tech.co", responseStatus: "accepted" },
        { email: "architect@tech.co", responseStatus: "accepted" }
      ],
      isSimulated: true
    }
  ];

  useEffect(() => {
    if (user !== undefined) {
      if (token) {
        fetchCalendarEvents(token);
      } else {
        setMeetings(simulatedMeetings);
        setShowSimulated(true);
      }
      return;
    }

    // Initialise Firebase auth state listener
    const unsubscribe = initAuth(
      (currentUser, cachedToken) => {
        setLocalUser(currentUser);
        setLocalToken(cachedToken);
        setLocalNeedsAuth(false);
        fetchCalendarEvents(cachedToken);
      },
      () => {
        setLocalNeedsAuth(true);
        setLocalUser(null);
        setLocalToken(null);
        // Default to simulated meetings
        setMeetings(simulatedMeetings);
      }
    );
    return () => unsubscribe();
  }, [user, token]);

  const handleLogin = async () => {
    if (onLogin) {
      await onLogin();
      return;
    }
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setLocalUser(result.user);
        setLocalToken(result.accessToken);
        setLocalNeedsAuth(false);
        await fetchCalendarEvents(result.accessToken);
      }
    } catch (err) {
      console.error("Login failed or closed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
      return;
    }
    await logout();
    setLocalUser(null);
    setLocalToken(null);
    setLocalNeedsAuth(true);
    setMeetings(simulatedMeetings);
  };

  const fetchCalendarEvents = async (accessToken: string) => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay}&timeMax=${endOfDay}&singleEvents=true&orderBy=startTime`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        const mapped: Meeting[] = (data.items || []).map((item: any) => ({
          id: item.id,
          summary: item.summary || "Untitled Event",
          description: item.description,
          location: item.location,
          meetLink: item.hangoutLink || item.location || "",
          start: { dateTime: item.start?.dateTime, date: item.start?.date },
          end: { dateTime: item.end?.dateTime, date: item.end?.date },
          attendees: item.attendees,
          isSimulated: false
        }));
        
        // If real calendar is empty, merge with simulated meetings so the UI is non-empty
        if (mapped.length === 0) {
          setMeetings(simulatedMeetings);
        } else {
          setMeetings(mapped);
        }
        setShowSimulated(false);
      } else {
        console.error("Calendar API query error, using simulated models instead.");
        setMeetings(simulatedMeetings);
      }
    } catch (e) {
      console.error("Calendar retrieve error:", e);
      setMeetings(simulatedMeetings);
    } finally {
      setLoading(false);
    }
  };

  const formatMeetTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return "All Day";
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div id="meeting-calendar-dashboard" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600 h-full" />

      {/* Header bar with auth logs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-sans tracking-tight flex items-center gap-2">
              Today's Meeting Calendar
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
            </h3>
            <p className="text-xs text-slate-500">
              {showSimulated ? "Showing active simulated tasks" : "Connected to Google Calendar API"}
            </p>
          </div>
        </div>

        {/* Auth action or Profile details */}
        <div>
          {currentNeedsAuth ? (
            <button
              id="google-signin-btn"
              onClick={handleLogin}
              className="gsi-material-button text-xs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#ffffff",
                color: "#1f1f1f",
                border: "1px solid #d1d5db",
                borderRadius: "100px",
                padding: "8px 16px",
                fontWeight: "500",
                fontFamily: "Roboto, sans-serif",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <div className="gsi-material-button-icon" style={{ marginRight: "10px", display: "flex" }}>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "16px", height: "16px" }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents font-semibold text-xs text-slate-700">Sign in with Google</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{currentUser?.displayName || "Connected User"}</p>
                <p className="text-[10px] text-slate-500 font-mono leading-none">{currentUser?.email}</p>
              </div>
              <button
                id="google-logout-btn"
                onClick={handleLogout}
                className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all cursor-pointer"
                title="Disconnect from Calendar"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Calendar items list */}
      <div className="space-y-3.5">
        {meetings.length === 0 ? (
          <div className="text-center py-12 bg-[#0c0c0f] border border-dashed border-slate-200 rounded-xl">
            <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-slate-700 font-medium">No meetings scheduled for today</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Your calendar is clean! You can select "Simulate" to interact with prepped alignment syncs.
            </p>
          </div>
        ) : (
          meetings.map((meet) => {
            const isSelected = activeMeetingId === meet.id;
            const startTimeStr = formatMeetTime(meet.start.dateTime);
            const endTimeStr = formatMeetTime(meet.end.dateTime);
            const attendeeCount = meet.attendees?.length || 0;

            return (
              <div
                key={meet.id}
                onClick={() => onSelectMeeting(meet)}
                className={`group p-4 rounded-xl border transition-all duration-300 cursor-pointer text-left relative overflow-hidden ${
                  isSelected
                    ? "bg-indigo-50/50 border-indigo-200 shadow-sm ring-1 ring-indigo-500/10"
                    : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80"
                }`}
              >
                {/* Simulated pill flag */}
                {meet.isSimulated && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-mono rounded border border-indigo-100">
                    SIMULATED
                  </span>
                )}

                <div className="flex items-start gap-4">
                  {/* Left clock stack */}
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-slate-800 tracking-tight">{startTimeStr}</span>
                    <span className="text-[10px] text-slate-500 font-mono">to {endTimeStr}</span>
                    <div className="w-px h-8 bg-slate-200 my-1 group-hover:bg-indigo-300 transition-all" />
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  </div>

                  {/* Meeting Details Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                      {meet.summary}
                    </h4>
                    
                    {meet.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {meet.description}
                      </p>
                    )}

                    {/* Metadata strip */}
                    <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" /> {attendeeCount} participant{attendeeCount !== 1 && "s"}
                      </span>
                      {meet.meetLink && (
                        <span className="flex items-center gap-1 text-indigo-600 hover:underline">
                          <Link2 className="w-3.5 h-3.5" /> Join Meet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Launch button */}
                  <div className="flex items-center self-center pl-2">
                    <button
                      id={`launch-${meet.id}-btn`}
                      className={`p-2 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white"
                      }`}
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Integration check banner */}
      <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-indigo-600" />
        <span className="text-[10px] text-slate-500">
          OAuth client secured. Google API calendar check bounded within today's time range securely.
        </span>
      </div>
    </div>
  );
}
