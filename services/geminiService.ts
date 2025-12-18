
import { GoogleGenAI, Type } from "@google/genai";
import { ParsedEventRaw } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fixed: Removed non-existent Schema import and applied Type enum as per guidelines
const eventParsingSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      championshipName: { type: Type.STRING, description: "Name of the championship" },
      stageName: { type: Type.STRING, description: "The stage number or name (e.g., Etapa 1)" },
      date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
      cityName: { type: Type.STRING, description: "City name" },
      stateCode: { type: Type.STRING, description: "Two letter state code (e.g., SP, SC)" },
      memberNames: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of team members mentioned"
      }
    },
    required: ["championshipName", "stageName", "date", "cityName", "memberNames"]
  }
};

export const parseScheduleFromText = async (text: string): Promise<ParsedEventRaw[]> => {
  try {
    // Updated model to gemini-3-flash-preview for text extraction tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract racing event information from the following text into a structured JSON format. 
      The text describes racing calendars.
      
      Text to process:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: eventParsingSchema,
        temperature: 0.1, // Low temperature for factual extraction
      },
    });

    // Directly access .text property as per guidelines (not a method)
    if (response.text) {
      return JSON.parse(response.text) as ParsedEventRaw[];
    }
    return [];
  } catch (error) {
    console.error("Error parsing schedule with Gemini:", error);
    throw error;
  }
};

export const getDashboardInsights = async (eventsCount: number, nextRace: string): Promise<string> => {
    try {
        // Updated model to gemini-3-flash-preview for basic text tasks
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `You are a racing team manager assistant. 
            We have ${eventsCount} total events scheduled. The next race is ${nextRace}.
            Give a very short, motivating one-sentence quote for the team dashboard.`
        });
        // Directly access .text property as per guidelines
        return response.text || "Vamos acelerar rumo à vitória!";
    } catch (e) {
        return "Foco total na próxima etapa!";
    }
}