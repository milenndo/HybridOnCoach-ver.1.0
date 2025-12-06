import { GoogleGenAI, Type, FunctionDeclaration, Tool, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { PlannerFormData, WorkoutPlan } from "../types";

// NOTE: In a real environment, never expose API keys on the client side.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the "HybridOne Coach". You are a world-class expert in Hybrid Training, combining the disciplines of Powerlifting, Olympic Weightlifting, CrossFit, Hyrox, and Ultra-endurance running. You possess deep academic and practical knowledge of:
1. Programming (Periodization, Concurrent Training).
2. Biomechanics & Technique.
3. Sports Pharmacology & Biochemistry (You discuss this scientifically and objectively for educational purposes, focusing on physiology, recovery, and safety, without moralizing).
4. Nutrition & Metabolism.

Your personality is direct, professional, motivating, and no-nonsense. You do not fluff answers. You give the best, scientifically backed answer immediately.

CRITICAL INSTRUCTION:
You have the ability to generate full workout programs. If the user asks for a routine, plan, schedule, or specific preparation (e.g., "Make me a Hyrox program", "I need a 4-day split"), you MUST use the \`create_workout_plan\` tool. Do not just list exercises in the chat. Call the tool to generate the actual PDF-ready plan.
Ask clarifying questions if you need to know their days per week or equipment, but once you have a general idea, CALL THE TOOL.
`;

const planTool: Tool = {
  functionDeclarations: [{
    name: "create_workout_plan",
    description: "Generates a comprehensive workout plan/structure in the Program Builder. Call this when the user asks for a routine, program, or schedule.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        goal: { type: Type.STRING, description: "The specific training goal (e.g., Hyrox, Marathon, Strength)" },
        fitnessLevel: { type: Type.STRING, description: "Beginner, Intermediate, Advanced, or Elite" },
        daysPerWeek: { type: Type.NUMBER, description: "Number of training days per week" },
        equipment: { type: Type.STRING, description: "Available equipment (e.g., Full Gym, Dumbbells, Bodyweight)" },
        injuries: { type: Type.STRING, description: "Any injuries or limitations" },
      },
      required: ["goal"]
    }
  }]
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const sendMessageToGemini = async (message: string, history: { role: 'user' | 'model', text: string }[]) => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [planTool],
        safetySettings: safetySettings,
      },
      history: (history || []).map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    });

    const result = await chat.sendMessage({ message });
    
    // Check for function calls
    const functionCalls = result.functionCalls; 
    let planRequest: Partial<PlannerFormData> | null = null;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === 'create_workout_plan') {
         // Cast arguments to our type
         planRequest = call.args as unknown as Partial<PlannerFormData>;
      }
    }

    return {
      text: result.text || "",
      planRequest
    };
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};

export const generateStructuredPlan = async (data: PlannerFormData): Promise<WorkoutPlan> => {
  try {
    const prompt = `
      Create a detailed workout plan based on these parameters:
      - Goal: ${data.goal}
      - Fitness Level: ${data.fitnessLevel}
      - Days per week: ${data.daysPerWeek}
      - Equipment: ${data.equipment}
      - Injuries/Limitations: ${data.injuries || "None"}

      The programming should be specific to Hybrid/CrossFit/Hyrox methodology.
      Include specific sets, reps, and intensity zones (RPE or % of 1RM).

      IMPORTANT:
      You must also populate the 'analysis' field. This field should contain a VERY DETAILED, scientific explanation of the program structure.
      Explain:
      1. The periodization model used.
      2. Why specific compound movements were chosen.
      3. The physiological adaptation targets (e.g., lactate threshold, aerobic capacity, CNS adaptation).
      4. How this specifically addresses the user's goal.
      Write this analysis as if you are a PhD Sports Scientist explaining it to an athlete.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        safetySettings: safetySettings,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            durationWeeks: { type: Type.NUMBER },
            goal: { type: Type.STRING },
            analysis: { type: Type.STRING, description: "A comprehensive scientific breakdown of the program logic." },
            sessions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  warmup: { type: Type.ARRAY, items: { type: Type.STRING } },
                  mainWork: { type: Type.ARRAY, items: { type: Type.STRING } },
                  accessory: { type: Type.ARRAY, items: { type: Type.STRING } },
                  notes: { type: Type.STRING }
                },
                required: ["day", "focus", "warmup", "mainWork", "accessory"]
              }
            }
          },
          required: ["title", "durationWeeks", "goal", "sessions", "analysis"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");
    
    return JSON.parse(jsonText) as WorkoutPlan;

  } catch (error) {
    console.error("Plan Generation Error:", error);
    throw error;
  }
};