import { useState, useEffect, useRef } from "react";
import { Meeting, CallNote, LearntWord } from "../types";
import { 
  Users, Mic, MicOff, PhoneOff, Sparkles, Terminal, Play, 
  HelpCircle, CheckCircle, RefreshCw, Send, Volume2, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ActiveCallSimulatorProps {
  meeting: Meeting;
  onCallEnded: (note: CallNote) => void;
}

interface SpeakerSegment {
  speaker: string;
  text: string;
  isAgent?: boolean;
}

export default function ActiveCallSimulator({ meeting, onCallEnded }: ActiveCallSimulatorProps) {
  const [isDialedIn, setIsDialedIn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [closingCall, setClosingCall] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  
  // Real-time transcribed timeline
  const [transcript, setTranscript] = useState<SpeakerSegment[]>([
    { speaker: "Sarah (Team Lead)", text: "Good morning team, let's sync up. We need updates on the deployment parameters." },
    { speaker: "James (Architect)", text: "I've deployed the server cluster, we just need to confirm the Google Calendar route permissions are secure." }
  ]);

  // Simulated agent actions logs
  const [logs, setLogs] = useState<string[]>([
    `[SYSTEM] Pre-checking calendar meeting details: "${meeting.summary}"`,
    `[SYSTEM] Bounded audio buffers initialized for microphone.`,
    `[AGENT] Auto-join scheduler active. Ready to dial in.`
  ]);

  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [waveformActive, setWaveformActive] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Pre-seeded prompt helpers the user can click to ask
  const suggestedQuestions = [
    "Varad, can we get an update on your calendar task progress?",
    "Do you have any deployment blockers or concerns today?",
    "Hey Varad, did we agree on how the ESM bundler runs in our environment?",
  ];

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, logs]);

  const handleDialIn = () => {
    setIsDialedIn(true);
    addLog("[AGENT] Actively dialing into the Meet/Zoom call bridge...");
    addLog(`[AGENT] Joined conference space successfully. Audio stream established on port 3000.`);
    addLog("[AGENT] Actively monitoring conversation for Varad keywords or direct inquiries...");
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  // Speaks on behalf of the user
  const handleAudienceQuery = async (queryText: string) => {
    if (!queryText.trim() || loadingResponse) return;
    
    // Add speaking question from other participant
    const otherSpeaker = "Sarah (Team Lead)";
    const updatedTranscript = [...transcript, { speaker: otherSpeaker, text: queryText }];
    setTranscript(updatedTranscript);
    addLog(`[CONVERSATION] Detected Question: "${queryText}" by ${otherSpeaker}`);
    setActiveSpeaker(otherSpeaker);

    setLoadingResponse(true);
    addLog("[AGENT] Compiling conversation state. Accessing trained QA training sheets...");

    try {
      // Map previous turns context to feed into Gemini
      const previousTurns = transcript.slice(-3).map((t) => ({
        role: t.isAgent ? "model" : "user",
        text: `${t.speaker}: ${t.text}`
      }));

      const res = await fetch("/api/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: queryText, previousTurns })
      });

      if (res.ok) {
        const data = await res.json();
        const agentText = data.text;

        // Simulate voice processing delay
        setTimeout(async () => {
          setTranscript((prev) => [...prev, { speaker: "Varad (Voice Delegate AI)", text: agentText, isAgent: true }]);
          setActiveSpeaker("Varad (Voice Delegate AI)");
          setWaveformActive(true);
          addLog(`[SPEECH] Synthesizing acoustic footprint. Speed: 1.0x, Pitch: 1.0x`);
          addLog(`[AGENT] Answering: "${agentText}"`);

          // Execute custom HTML5 synthesizer voice playback using calibrated rates
          const voiceProfileRes = await fetch("/api/voice");
          let pitch = 1.0;
          let speed = 1.0;
          let voiceStyle = "Zephyr (Modern Male)";
          if (voiceProfileRes.ok) {
            const vpObj = await voiceProfileRes.json();
            pitch = vpObj.pitch;
            speed = vpObj.speed;
            voiceStyle = vpObj.voiceStyle;
          }

          const utterance = new SpeechSynthesisUtterance(agentText);
          utterance.pitch = pitch;
          utterance.rate = speed;
          
          const voices = window.speechSynthesis.getVoices();
          if (voiceStyle.toLowerCase().includes("female")) {
            const femaleVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Microsoft Zira") || v.lang.startsWith("en"));
            if (femaleVoice) utterance.voice = femaleVoice;
          } else {
            const maleVoice = voices.find(v => v.name.includes("Microsoft David") || v.lang.startsWith("en"));
            if (maleVoice) utterance.voice = maleVoice;
          }

          utterance.onend = () => {
            setWaveformActive(false);
            setActiveSpeaker(null);
            addLog("[AGENT] Response complete. Resuming audio monitoring stream.");
          };

          window.speechSynthesis.speak(utterance);

          // Dynamic phrase learning logic: "and also learn what to speak if any new words it got"
          checkForUnknownVocabulary(queryText, agentText);
        }, 1200);

      } else {
        throw new Error();
      }
    } catch (e) {
      addLog("[ERROR] Failed to compile server-side response. Check key environment secrets.");
      alert("Verification error formulating response. Make sure GEMINI_API_KEY is defined in Settings > Secrets if testing live APIs.");
    } finally {
      setLoadingResponse(false);
    }
  };

  const checkForUnknownVocabulary = (question: string, answer: string) => {
    // Look for technical acronyms or obscure terminology (defined by capital case phrases or technical keywords)
    const patterns = /\b([A-Z]{3,8}|[a-zA-Z]+[0-9]+)\b/g;
    const matches = question.match(patterns) || [];
    
    // Clean unique jargon matches
    const jargonWords = Array.from(new Set(matches)).filter(
      (w) => !["AND", "THE", "YOU", "FOR", "THAT", "YES", "WHAT"].includes(w.toUpperCase())
    );

    if (jargonWords.length > 0) {
      jargonWords.forEach((word) => {
        addLog(`[LEARNING] Detected potential new terminology: "${word}". Processing lookup definition...`);
        
        // Simulating/Triggering beautiful automated glossary integration
        const newWord: LearntWord = {
          id: "vocab-" + Date.now() + Math.random().toString(36).substr(2, 4),
          word: word,
          definition: `Dynamically resolved terminology during "${meeting.summary}" call. Registered to answer future inquiries about ${word} efficiently.`,
          context: `Answering inquiry: "${question}"`,
          learntTime: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        };

        // Persist to local storage
        const currentWords = JSON.parse(localStorage.getItem("learnt_words") || "[]");
        // Avoid duplicate word additions
        if (!currentWords.some((cw: any) => cw.word.toLowerCase() === word.toLowerCase())) {
          localStorage.setItem("learnt_words", JSON.stringify([newWord, ...currentWords]));
          addLog(`[LEARNING] Terminology "${word}" successfully added to trained glossary.`);
        }
      });
    }
  };

  const handleEndAndSummarize = async () => {
    setClosingCall(true);
    addLog("[AGENT] Hangup triggered. Closing audio connection.");
    addLog("[SYSTEM] Reconstructing transcript context. Triggering Gemini-3.5-flash summarizer...");

    try {
      // Build transcript dump string
      const fullTranscriptText = transcript
        .map((t) => `${t.speaker}: ${t.text}`)
        .join("\n");

      const res = await fetch("/api/summarize-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: meeting.summary, transcript: fullTranscriptText })
      });

      if (res.ok) {
        const data = await res.json();
        addLog("[SYSTEM] Synthesis complete. Meeting overview and checklist tasks generated.");
        
        const feedbackNote: CallNote = {
          id: "call-" + Date.now(),
          title: meeting.summary,
          time: new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }),
          transcript: fullTranscriptText,
          summary: data.summary,
          assignedTasks: data.assignedTasks,
          status: "completed",
          agentActivityDetails: [
            "Auto-dialed into target meeting call on time.",
            `Formulated custom spoken answers matching your calibrated Q&A rules in real-time.`,
            `Registered new jargon words inside trained terminology glossaries.`,
            "Analyzed audio waves and synthesized notes instantly on end."
          ]
        };

        // Append to local database endpoints
        const listRes = await fetch("/api/calls");
        if (listRes.ok) {
          const currentList = await listRes.json();
          await fetch("/api/calls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([feedbackNote, ...currentList])
          });
        }

        alert("Meeting Summarized successfully! Notes and Assigned Tasks compiled.");
        onCallEnded(feedbackNote);
      } else {
        throw new Error();
      }
    } catch (e) {
      console.error(e);
      addLog("[ERROR] Compilation failed. Saving default fallback highlights.");
      
      const fallbackNote: CallNote = {
        id: "call-" + Date.now(),
        title: meeting.summary,
        time: "Today",
        transcript: "Simulated speech alignment standup logs.",
        summary: "The meeting completed successfully. The voice delegate answered questions and summarized remaining compilation backlog deliverables.",
        assignedTasks: ["Investigate build warning patterns", "Calibrate microphone acoustic properties"],
        status: "completed"
      };
      onCallEnded(fallbackNote);
    } finally {
      setClosingCall(false);
    }
  };

  return (
    <div id="active-call-environment" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Video feeds/Simulator Grid */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Conference Room View */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[300px] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />

          {/* Room Toolbar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
            <div>
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded border mr-2 uppercase tracking-widest font-bold ${
                isDialedIn 
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                {isDialedIn ? "LIVE BROADCAST" : "IDLE CHAMBER"}
              </span>
              <span className="text-xs font-bold text-slate-800">{meeting.summary}</span>
            </div>

            {isDialedIn && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>3 active participants</span>
              </div>
            )}
          </div>

          {!isDialedIn ? (
            /* Dial in cover screen */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 my-4 shadow-inner">
              <Sparkles className="w-12 h-12 text-indigo-600 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-800">Delegate AI Voice Agent</h4>
              <p className="text-xs text-slate-600 mt-1.5 max-w-sm">
                Connect your automated voice agent to auto-join this meeting. It will speak using your trained voice profile and respond to topics based on your configured Q&A training sheets.
              </p>
              <button
                id="dial-in-btn"
                onClick={handleDialIn}
                className="mt-5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all"
              >
                <Play className="w-4 h-4 fill-white" /> Dial In Voice Agent
              </button>
            </div>
          ) : (
            /* Active call conference simulation grid */
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-3">
              {/* Participant 1 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm">
                <div className="w-12 h-12 bg-rose-50 rounded-full border border-rose-200 flex items-center justify-center text-rose-600 text-lg font-bold mb-2">
                  SL
                </div>
                <h5 className="text-xs font-bold text-slate-800">Sarah (Team Lead)</h5>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">Scrum Master</span>
                {activeSpeaker === "Sarah (Team Lead)" && (
                  <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>

              {/* Participant 2 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 rounded-full border border-indigo-200 flex items-center justify-center text-indigo-600 text-lg font-bold mb-2">
                  JA
                </div>
                <h5 className="text-xs font-bold text-slate-800">James (Architect)</h5>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">Backend Tech Lead</span>
                {activeSpeaker === "James (Architect)" && (
                  <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>

              {/* Varad - Voice Delegate Agent */}
              <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-indigo-50/10 animate-pulse" />
                
                {waveformActive ? (
                  /* Animated sound wave columns */
                  <div className="flex gap-1 h-12 items-center mb-2 z-10 justify-center">
                    <span className="w-1 bg-indigo-600 rounded h-10 animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-1 bg-indigo-600 rounded h-6 animate-bounce" style={{ animationDelay: "0.3s" }} />
                    <span className="w-1 bg-teal-600 rounded h-12 animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1 bg-indigo-600 rounded h-8 animate-bounce" style={{ animationDelay: "0.4s" }} />
                    <span className="w-1 bg-indigo-600 rounded h-4 animate-bounce" style={{ animationDelay: "0.5s" }} />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-indigo-100 rounded-full border border-indigo-200 flex items-center justify-center text-indigo-700 text-lg font-bold mb-2 z-10 animate-pulse">
                    VD
                  </div>
                )}
                
                <h5 className="text-xs font-bold text-indigo-700 z-10 flex items-center gap-1">
                  Varad's AI Clone
                </h5>
                <span className="text-[10px] text-slate-500 font-semibold mt-0.5 z-10">
                  {waveformActive ? "SPEAKING ON BEHALF" : "MONITORING LINE"}
                </span>
                
                {activeSpeaker === "Varad (Voice Delegate AI)" && (
                  <span className="absolute top-2 right-2 text-[8px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 rounded animate-pulse">
                    GENERATING TTS
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Active audio logs ticker */}
          {isDialedIn && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 flex flex-col shadow-inner">
              <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-indigo-600 mb-2">Live Transcript Tick</span>
              
              <div className="flex-1 overflow-y-auto max-h-[160px] space-y-2.5 pr-1 scrollbar-thin">
                {transcript.map((seg, idx) => (
                  <div key={idx} className="text-xs leading-relaxed">
                    <span className={`font-bold mr-1.5 ${seg.isAgent ? "text-indigo-700" : "text-slate-800"}`}>
                      {seg.speaker}:
                    </span>
                    <span className={seg.isAgent ? "text-indigo-600 italic bg-indigo-50/50 px-1 py-0.5 rounded font-medium" : "text-slate-600 font-sans"}>
                      "{seg.text}"
                    </span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
          )}

          {/* Conference Action Controls bar */}
          {isDialedIn && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <div className="flex items-center gap-2">
                <button
                  id="mute-micro-btn"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    isMuted
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 shadow-sm"
                  }`}
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <button
                id="end-delegate-btn"
                onClick={handleEndAndSummarize}
                disabled={closingCall}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                {closingCall ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling Notes...
                  </>
                ) : (
                  <>
                    <PhoneOff className="w-4 h-4" /> End Call & Summarize NOTES
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Audience Questions Testbed section */}
        {isDialedIn && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-750 text-slate-700 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" /> Interactive Testbed: Trigger inquiries to Varad
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Click any typical meeting standup question below to simulate other speakers questioning Varad, and watch the AI reply in real-time speaker audio using your Q&A knowledge sheets:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  id={`suggested-${idx}-btn`}
                  onClick={() => handleAudienceQuery(q)}
                  disabled={loadingResponse}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs text-slate-700 font-medium rounded-xl transition-all leading-snug hover:border-indigo-400/50 shadow-sm cursor-pointer font-medium whitespace-normal"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Manual user dialogue input */}
            <div className="flex gap-2">
              <input
                id="manual-query-input"
                type="text"
                placeholder="Type a custom standing question for Varad..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && [handleAudienceQuery(customQuery), setCustomQuery("")]}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm h-10"
              />
              <button
                id="send-query-btn"
                onClick={() => {
                  handleAudienceQuery(customQuery);
                  setCustomQuery("");
                }}
                disabled={loadingResponse || !customQuery.trim()}
                className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-50 rounded-xl text-white font-semibold transition-all flex items-center justify-center cursor-pointer h-10 shadow-sm"
              >
                {loadingResponse ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backend / Agent Activity telemetry logs terminal */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col font-mono min-h-[420px] text-white">
        <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 pb-2.5 border-b border-slate-800 mb-3">
          <Terminal className="w-4 h-4 text-emerald-400" /> Delegate AI Telemetry logs
        </h4>

        <div className="flex-1 overflow-y-auto space-y-2.5 text-[10px] text-slate-400 leading-normal scrollbar-thin">
          {logs.map((log, idx) => {
            let color = "text-slate-500";
            if (log.includes("[AGENT]")) color = "text-emerald-400";
            if (log.includes("[SPEECH]")) color = "text-indigo-400";
            if (log.includes("[LEARNING]")) color = "text-amber-400";
            if (log.includes("[SYSTEM]")) color = "text-blue-400";
            if (log.includes("[ERROR]")) color = "text-rose-400 font-bold";

            return (
              <div key={idx} className={color}>
                {log}
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800 mt-3 bg-black/30 p-2.5 rounded text-[10px] text-slate-400 leading-normal">
          <span className="font-bold text-indigo-300">Activity Checklist:</span>
          <div className="space-y-1 mt-1 font-sans">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Join Call bridge scheduled
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Ground answers to trained sheet
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-full border ${waveformActive ? "bg-indigo-500 border-indigo-500" : "border-slate-700"}`} /> Emit Voice clone synthesized audio
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-full border ${isDialedIn ? "border-emerald-400 animate-pulse bg-emerald-500/10" : "border-slate-700"}`} /> Dynamic glossary terminology tracking
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
