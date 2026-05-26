import { useState, useEffect } from "react";
import { QAEntry, LearntWord } from "../types";
import { BookOpen, Plus, Trash2, Library, Check, Star, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function KnowledgeBaseForm() {
  const [qaList, setQaList] = useState<QAEntry[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Simulated live vocabulary learned dynamically
  const [learntWords, setLearntWords] = useState<LearntWord[]>([
    {
      id: "w-1",
      word: "HMR",
      definition: "Hot Module Replacement. Enabled dynamic assets re-compilations on browser context, typically toggled off here to conserve CPU standard resources during active agent edits.",
      context: "Discovered during standup engineering sync.",
      learntTime: "Today at 10:15 AM"
    },
    {
      id: "w-2",
      word: "ESM Bundles",
      definition: "ECMAScript Modules. Standard bundle structure for production builds, resolved server side to ensure seamless compliance without path crashes.",
      context: "Discovered during build verification discussion.",
      learntTime: "Yesterday at 3:12 PM"
    }
  ]);

  const preseededQA = [
    {
      question: "Are there any blockers preventing your task progress?",
      answer: "No blockers currently. All environment tokens are initialized and the dev server compiled successfully."
    },
    {
      question: "What is your target timeline for the final application build?",
      answer: "We aim to complete building and pass clean lints by late afternoon, with a safe deployment on production Cloud Run containers immediately following verification."
    },
    {
      question: "Could you walk us through the database schema choices?",
      answer: "We choose the pragmatic JSON persistent structures saved to /data, allowing clean reading and write locks without setting up heavy GCP databases."
    }
  ];

  useEffect(() => {
    fetchQa();
    // Load learned words from localStorage if any
    const savedWords = localStorage.getItem("learnt_words");
    if (savedWords) {
      try {
        setLearntWords(JSON.parse(savedWords));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchQa = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/qa");
      if (res.ok) {
        const data = await res.json();
        setQaList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addQaEntry = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const newEntry: QAEntry = {
      id: "entry-" + Date.now(),
      question: newQuestion,
      answer: newAnswer
    };
    const updated = [...qaList, newEntry];
    setQaList(updated);
    setNewQuestion("");
    setNewAnswer("");
    saveQaList(updated);
  };

  const deleteEntry = (id: string) => {
    const updated = qaList.filter((e) => e.id !== id);
    setQaList(updated);
    saveQaList(updated);
  };

  const preseedItem = (item: { question: string; answer: string }) => {
    if (qaList.some(q => q.question.toLowerCase() === item.question.toLowerCase())) return;
    const newEntry: QAEntry = {
      id: "entry-" + Date.now(),
      ...item
    };
    const updated = [...qaList, newEntry];
    setQaList(updated);
    saveQaList(updated);
  };

  const saveQaList = async (listToSave: QAEntry[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listToSave)
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      console.error("Error saving Q&A sheet:", e);
    } finally {
      setSaving(false);
    }
  };

  const clearLearntWords = () => {
    setLearntWords([]);
    localStorage.removeItem("learnt_words");
  };

  return (
    <div id="knowledge-base-training" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Question sheet */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-teal-500 to-emerald-600 h-full" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Q&A Knowledge Training Sheet</h3>
              <p className="text-xs text-slate-500">Add questions and matching answers the AI will use to formulate responses</p>
            </div>
          </div>
          {saving && <span className="text-[10px] font-mono text-teal-600 animate-pulse font-bold">Auto-saving...</span>}
        </div>

        {/* Existing Q&As */}
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 my-6 scrollbar-thin">
          <AnimatePresence initial={false}>
            {qaList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                <Library className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No training data populated yet.</p>
                <p className="text-xs text-slate-400 mt-1">Use the preseed panel or form below to inject sheets.</p>
              </div>
            ) : (
              qaList.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl group relative hover:bg-slate-100 hover:border-teal-500/30 transition-all shadow-sm"
                >
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-rose-600 bg-slate-200/50 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex gap-2 mb-2 pr-6">
                    <span className="text-[11px] font-mono font-bold text-teal-705 text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      Q
                    </span>
                    <h4 className="text-sm font-bold text-slate-800">{entry.question}</h4>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-[11px] font-mono font-bold text-amber-705 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 h-fit">
                      A
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">{entry.answer}</p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Form to insert new training point */}
        <div className="bg-slate-100/60 p-5 rounded-xl border border-slate-200 shadow-inner">
          <h4 className="text-xs font-bold text-slate-705 text-slate-700 uppercase tracking-wider mb-3">Add Custom Response Sheet</h4>
          <div className="space-y-3">
            <div>
              <input
                id="new-question-input"
                type="text"
                placeholder="What might they ask? (e.g., Blockers, status of calendar, database choice)"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-505 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
            </div>
            <div>
              <textarea
                id="new-answer-textarea"
                placeholder="How should the clone speak on your behalf? Be precise and realistic."
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-555 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-16 resize-none shadow-sm"
              />
            </div>
            <button
              id="add-training-entry-btn"
              onClick={addQaEntry}
              disabled={!newQuestion.trim() || !newAnswer.trim()}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-850 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Save Training Pair
            </button>
          </div>
        </div>
      </div>

      {/* Preseed helpers and Vocabulary */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Preseed prompts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Preseeded Standard Questions
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Quickly load common corporate standup questions to pre-configure your agent:
          </p>

          <div className="space-y-2.5">
            {preseededQA.map((item, idx) => {
              const alreadyExists = qaList.some(q => q.question.toLowerCase() === item.question.toLowerCase());
              return (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-left hover:bg-slate-100 hover:border-indigo-300 transition-all shadow-sm"
                >
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800 mb-1 leading-snug">"{item.question}"</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic">"{item.answer}"</p>
                  </div>
                  <button
                    onClick={() => preseedItem(item)}
                    disabled={alreadyExists}
                    className={`p-1 rounded border transition-all cursor-pointer ${
                      alreadyExists
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                        : "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-600 hover:text-white"
                    }`}
                  >
                    {alreadyExists ? <Check className="w-3 h-3 text-emerald-700" /> : <Plus className="w-3 h-3" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Vocabulary Learning bank */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Library className="w-4 h-4 text-teal-600" /> Deep Learnt Terminology Bank
            </h3>
            {learntWords.length > 0 && (
              <button
                onClick={clearLearntWords}
                className="text-[10px] text-slate-500 hover:text-rose-600 transition-all font-bold cursor-pointer underline"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Words or context terms detected in meetings that weren't inside the Q&A database. The delegate dynamically resolves them and logs meanings:
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[200px] pr-1">
            {learntWords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-8 border border-dashed border-slate-300 rounded-xl bg-slate-50 shadow-inner">
                <p className="text-[11px] text-slate-500 font-semibold italic">No dynamic vocab learned yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Learns vocabulary during simulation dialogs!</p>
              </div>
            ) : (
              learntWords.map((item) => (
                <div key={item.id} className="p-3.5 bg-teal-50/50 border border-teal-100 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-teal-700 font-mono">{item.word}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{item.learntTime}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal mb-1.5 font-medium">{item.definition}</p>
                  <p className="text-[10px] text-slate-500 font-sans italic bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded leading-normal inline-block">
                    Source: {item.context}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
