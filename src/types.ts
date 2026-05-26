export interface VoiceProfile {
  name: string;
  voiceStyle: string;
  pitch: number;
  speed: number;
  baseAudioSample64?: string;
  updatedAt: string;
}

export interface QAEntry {
  id: string;
  question: string;
  answer: string;
}

export interface LearntWord {
  id: string;
  word: string;
  definition: string;
  context: string;
  learntTime: string;
}

export interface Meeting {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{ email: string; responseStatus?: string }>;
  meetLink?: string;
  isSimulated?: boolean;
}

export interface CallNote {
  id: string;
  title: string;
  time: string;
  transcript: string;
  summary: string;
  assignedTasks: string[];
  status: "completed" | "active" | "scheduled";
  agentActivityDetails?: string[];
}
