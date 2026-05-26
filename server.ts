import os from "os";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header for telemetry as advised in the skill
const ai = new GoogleGenAI({
  apiKey: os.environ.get("GEMINI_API_KEY"),
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Paths for simulated files to persist configuration, training data, and simulated logs
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const VOICE_CLONE_FILE = path.join(DATA_DIR, "voice_clone.json");
const QA_SHEET_FILE = path.join(DATA_DIR, "qa_sheet.json");
const CALLS_LOGS_FILE = path.join(DATA_DIR, "calls_logs.json");

// Helper to read JSON safely
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return defaultValue;
}

// Helper to write JSON safely
function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
  }
}

// Initialise Database Structures
interface VoiceProfile {
  name: string;
  voiceStyle: string;
  pitch: number;
  speed: number;
  baseAudioSample64?: string;
  updatedAt: string;
}

interface QAEntry {
  id: string;
  question: string;
  answer: string;
}

interface CallNote {
  id: string;
  title: string;
  time: string;
  transcript: string;
  summary: string;
  assignedTasks: string[];
  status: "completed" | "active" | "scheduled";
  agentActivityDetails?: string[];
}

// Standard endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 1. Voice Clone Endpoints
app.get("/api/voice", (req, res) => {
  const defaultVoice: VoiceProfile = {
    name: "My Custom Clone",
    voiceStyle: "Professional Male",
    pitch: 1.0,
    speed: 1.0,
    updatedAt: new Date().toISOString(),
  };
  const voice = readJsonFile<VoiceProfile>(VOICE_CLONE_FILE, defaultVoice);
  res.json(voice);
});

app.post("/api/voice", (req, res) => {
  const { name, voiceStyle, pitch, speed, baseAudioSample64 } = req.body;
  const voice: VoiceProfile = {
    name: name || "My Custom Clone",
    voiceStyle: voiceStyle || "Professional Male",
    pitch: Number(pitch) || 1.0,
    speed: Number(speed) || 1.0,
    baseAudioSample64,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile(VOICE_CLONE_FILE, voice);
  res.json({ success: true, voice });
});

// 2. Q&A Sheet Knowledge Base Endpoints
app.get("/api/qa", (req, res) => {
  const defaultQA: QAEntry[] = [
    {
      id: "1",
      question: "Can you attend our standup meeting and share updates?",
      answer: "Yes, I will join and present the task statuses. I worked on the server routes and configured the Google Calendar sync successfully. Today I'm wrapping up the UI and deploying.",
    },
    {
      id: "2",
      question: "What is your main task of the week?",
      answer: "My main focus is delivering the automated Google Calendar voice agent system with robust speech capabilities and custom task summaries.",
    },
  ];
  const list = readJsonFile<QAEntry[]>(QA_SHEET_FILE, defaultQA);
  res.json(list);
});

app.post("/api/qa", (req, res) => {
  const entries = req.body;
  if (Array.isArray(entries)) {
    writeJsonFile(QA_SHEET_FILE, entries);
    return res.json({ success: true, count: entries.length });
  }
  res.status(400).json({ error: "Invalid payload format. Must be an array." });
});

// 3. Simulated Calls & Meeting Notes Endpoints
app.get("/api/calls", (req, res) => {
  const initialCalls: CallNote[] = [
    {
      id: "sim-1",
      title: "Sync: Engineering Alignment Group",
      time: "Today at 10:00 AM",
      transcript: "Speaker 1 (Team Lead): Let's get updates from each domain.\nSpeaker 2 (Voice Agent): Hi, speaking on behalf of Varad. He completed the backend routes and set up the OAuth tokens for Calendar today. The next step is wraps up and check for lint errors.\nSpeaker 1: Great work. Can you make sure to test compile the production build by end of day?\nSpeaker 2 (Voice Agent): Understood. Recorded. I will assign that task to Varad.",
      summary: "The engineering team reviewed progress on domain alignment. The backend routes and Google Calendar token system are verified completed. We discussed compilation plans for the day.",
      assignedTasks: ["Validate production compiling before end of day", "Set up final automated linting integration"],
      status: "completed",
      agentActivityDetails: [
        "Joined call standup environment on time.",
        "Detected question: 'Let's get updates from each domain'.",
        "Formulated speaking response from trained QA knowledge base.",
        "Spoke on behalf of user with custom voice footprint config.",
        "Generated meeting notes and tasks via Gemini-3.5-flash.",
      ],
    },
  ];
  const list = readJsonFile<CallNote[]>(CALLS_LOGS_FILE, initialCalls);
  res.json(list);
});

app.post("/api/calls", (req, res) => {
  const list = req.body;
  if (Array.isArray(list)) {
    writeJsonFile(CALLS_LOGS_FILE, list);
    return res.json({ success: true });
  }
  res.status(400).json({ error: "Invalid payload format." });
});

// 4. Generate Speech / Speaking responses using Gemini TTS or Voice cloning configuration
app.post("/api/generate-response", async (req, res) => {
  try {
    const { message, previousTurns = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Load available QA database for grounding
    const qaList = readJsonFile<QAEntry[]>(QA_SHEET_FILE, []);
    const qaContext = qaList.map(item => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n");

    const systemPrompt = `You are a professional voice delegation assistant designed to speak on behalf of the user (Varad).
Your voice parameters, style, and general answering pattern are trained according to the client Q&A database below.

TRAINED KNOWLEDGE SHEET:
${qaContext}

INSTRUCTIONS:
- Directly respond to the incoming conversation question as Varad.
- Do not add comments like "As Varad, I would say". Speak in first person.
- If you don't know the exact answer from the training database, construct a professional response based on context or state that Varad is looking into it and will update them. Make sure to learn and write down the conversation summary inside notes.
- Keep the response brief, human, and natural (within 1 to 3 sentences suitable for real-time speech during meetings).`;

    const chatInput = [
      ...previousTurns.map((turn: any) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatInput,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Response Generation Error:", error);
    res.status(500).json({ error: error?.message || "Internal generation error" });
  }
});

// 5. Generate Meeting Notes, Summaries and Tasks using Gemini
app.post("/api/summarize-meeting", async (req, res) => {
  try {
    const { title, transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required for summarization." });
    }

    const systemPrompt = `You are an expert meeting minute recorder and summarizer. You parse the provided conversational meeting transcript and generate structured JSON outputs.
You must extract the core overview, key highlights, exact bullet-point list of actionable tasks explicitly or implicitly assigned to "Varad" (or the voice delegate assistant speaking on his behalf), and a high-level concise summary of what transpired.

Your output must be a valid JSON object matching this structure EXACTLY:
{
  "summary": "A concise paragraph summarizing the key discussion points and conclusions.",
  "assignedTasks": ["Task list string 1", "Task list string 2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate meeting highlights for meeting: "${title || "Standup Guild Sync"}" with the following full transcript text:\n\n${transcript}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT" as any,
          properties: {
            summary: { type: "STRING" as any },
            assignedTasks: {
              type: "ARRAY" as any,
              items: { type: "STRING" as any },
            },
          },
          required: ["summary", "assignedTasks"],
        },
      },
    });

    const parsedData = JSON.parse(response.text);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Meeting Summary Error:", error);
    res.status(500).json({ error: error?.message || "Internal summarization compilation error" });
  }
});

// Set up dev server / static production files server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
