export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface WorkoutSession {
  day: string;
  focus: string;
  warmup: string[];
  mainWork: string[];
  accessory: string[];
  notes: string;
}

export interface WorkoutPlan {
  title: string;
  durationWeeks: number;
  goal: string;
  analysis: string; // Detailed scientific explanation
  sessions: WorkoutSession[];
}

export enum AppMode {
  CHAT = 'CHAT',
  PLANNER = 'PLANNER',
}

export interface PlannerFormData {
  goal: string;
  fitnessLevel: string;
  daysPerWeek: number;
  equipment: string;
  injuries: string;
}

export interface PlanRequest extends Partial<PlannerFormData> {
  // Allow partial data from AI, will fill defaults
}