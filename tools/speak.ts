import Agent from "@tokenring-ai/agent/Agent";
import {z} from "zod";
import AudioService from "../AudioService.js";

export const name = "voice/speak";

export async function execute(
  {
    text,
    model,
    voice,
    speed,
    format
  }: {
    text?: string;
    model?: string;
    voice?: string;
    speed?: number;
    format?: string;
  },
  agent: Agent,
): Promise<{ data: any }> {
  
  const voiceService = agent.requireServiceByType(AudioService);

  if (!text) {
    throw new Error(`[${name}] text is required`);
  }

  agent.infoLine(`[${name}] Converting text to speech...`);
  const result = await voiceService.speak(text, {
    model,
    voice,
    speed,
    format
  });
  
  return { data: result.data };
}

export const description = "Convert text to speech using the active voice provider";

export const inputSchema = z.object({
  text: z.string().min(1).describe("Text to convert to speech"),
  model: z.string().optional().describe("TTS model"),
  voice: z.string().optional().describe("Voice ID"),
  speed: z.number().optional().describe("Speech speed"),
  format: z.string().optional().describe("Audio format"),
});