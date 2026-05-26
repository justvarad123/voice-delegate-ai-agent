import { useState, useEffect } from "react";
import { CallNote } from "../types";
import { FileText, Calendar, CheckSquare, ListTodo, FileSpreadsheet, Eye, ChevronRight, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

export default function NotesHistory() {
  const [calls, setCalls] = useState<CallNote[]>([]);
  const [activeCall, setActiveCall] = useState<CallNote | null>(null);
  const [loading, setLoading] = useState(false);

  // Load call records on mount
  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calls");
      if (res.ok) {
        const data = await res.json();
        setCalls(data);
        if (data.length > 0) {
          setActiveCall(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (callId: string, taskText: string) => {
    // Treat checkable sub-tasks lists cleanly
    // Since task checklist persists status inside notes, we can toggle it locally, and send update state
    const updatedCalls = calls.map((c) => {
      if (c.id === callId) {
        // Toggle item representation by modifying the task string or maintaining checked array indicators.
        // Let's toggle prepend flag like "[x] " or "[ ] " to make it fully client-facing and interactive in JSON logs!
        const modifiedTasks = c.assignedTasks.map((t) => {
          if (t === taskText) {
            return t.startsWith("✓ ") ? t.substring(2) : `✓ ${t}`;
          }
          return t;
        });
        return { ...c, assignedTasks: modifiedTasks };
      }
      return c;
    });

    setCalls(updatedCalls);
    const updatedActive = updatedCalls.find((c) => c.id === callId);
    if (updatedActive) {
      setActiveCall(updatedActive);
    }

    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCalls)
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="notes-compliance-history" className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      
      {/* Left panel call logs list */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Historic Meeting Notes & Audits
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Polished summaries and assigned items automatically compiled by Gemini on call hangup:
          </p>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {calls.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 italic font-semibold">No notes created yet. Run a call simulation first!</p>
              </div>
            ) : (
              calls.map((call) => {
                const isActive = activeCall?.id === call.id;
                const pendingTaskCount = call.assignedTasks.filter(t => !t.startsWith("✓ ")).length;

                return (
                  <div
                    key={call.id}
                    onClick={() => setActiveCall(call)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center group shadow-sm ${
                      isActive
                        ? "bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-500/10"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                        {call.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1.5 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> {call.time}
                        </span>
                        {pendingTaskCount > 0 ? (
                          <span className="text-amber-600 font-bold">
                            {pendingTaskCount} pending assignment{pendingTaskCount !== 1 && "s"}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Assignments complete
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? "text-emerald-600 translate-x-1" : ""}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right panel detail report */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {!activeCall ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full flex flex-col items-center justify-center text-center min-h-[300px]">
              <Eye className="w-12 h-12 text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No active compilation selected</h4>
              <p className="text-xs text-slate-500 mt-1">Choose a historic call log on the left to review transcript details.</p>
            </div>
          ) : (
            <motion.div
              key={activeCall.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-5"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

              {/* Title Header */}
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-mono font-bold text-emerald-705 text-emerald-700 uppercase tracking-widest block mb-1">
                  Gemini Complete Compilation
                </span>
                <h3 className="text-base font-bold text-slate-800 font-sans">{activeCall.title}</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">Conducted on {activeCall.time}</p>
              </div>

              {/* Meeting Summary Block */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  I. Executed Highlights Summary
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed text-xs text-slate-700 font-semibold font-sans shadow-inner">
                  <ReactMarkdown>{activeCall.summary}</ReactMarkdown>
                </div>
              </div>

              {/* Action items mapped checklist */}
              <div>
                <h4 className="text-xs font-bold text-slate-705 text-slate-700 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-emerald-600" /> II. Assigned tasks mapped to Varad
                </h4>
                
                {activeCall.assignedTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No tasks explicitly assigned to Varad in this meeting.</p>
                ) : (
                  <div className="space-y-2">
                    {activeCall.assignedTasks.map((task, idx) => {
                      const isCompleted = task.startsWith("✓ ");
                      const cleanText = isCompleted ? task.substring(2) : task;

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleTaskStatus(activeCall.id, task)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group shadow-sm ${
                            isCompleted
                              ? "bg-slate-50 border-slate-200 opacity-70"
                              : "bg-white border-slate-200 hover:bg-slate-50/50 hover:border-emerald-305 hover:border-emerald-300"
                          }`}
                        >
                          <div className="flex items-center gap-3 pr-4">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isCompleted
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 group-hover:border-emerald-500"
                            }`}>
                              {isCompleted && <Check className="w-3 h-3" />}
                            </span>
                            <span className={`text-xs ${isCompleted ? "line-through text-slate-400 font-sans font-medium" : "text-slate-755 text-slate-700 font-bold font-sans"}`}>
                              {cleanText}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Agent activity details list */}
              {activeCall.agentActivityDetails && activeCall.agentActivityDetails.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                    III. Voice Delegate Activity Log
                  </h4>
                  <ul className="space-y-1.5">
                    {activeCall.agentActivityDetails.map((act, index) => (
                      <li key={index} className="text-[10px] text-slate-500 font-sans flex items-start gap-1.5 leading-normal font-semibold">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Collapsed transcript segment */}
              <details className="group border border-slate-200 rounded-xl bg-slate-50 shadow-sm overflow-hidden">
                <summary className="p-3.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer list-none flex justify-between items-center transition-all select-none">
                  <span>Show Full Text Conversation Transcript ({activeCall.transcript.split('\n').length} turns)</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" />
                </summary>
                
                <div className="p-4 pt-1 border-t border-slate-200 max-h-[220px] overflow-y-auto font-mono text-[10px] text-slate-600 space-y-2 leading-relaxed whitespace-pre-line bg-white rounded-b-xl shadow-inner scrollbar-thin">
                  {activeCall.transcript}
                </div>
              </details>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
