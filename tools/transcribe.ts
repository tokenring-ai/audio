import Agent from "@tokenring-ai/agent/Agent";
import {z} from "zod";
import AudioService from "../AudioService.js";

export const name = "voice/transcribe";

export async function execute(
  {
    audioFile,
    model,
    language,
    timestampGranularity
  }: {
    audioFile?: any;
    model?: string;
    language?: string;
    timestampGranularity?: string;
  },
  agent: Agent,
): Promise<{ text: string }> {
  
  const voiceService = agent.requireServiceByType(AudioService);

  if (!audioFile) {
    throw new Error(`[${name}] audioFile is required`);
  }

  agent.infoLine(`[${name}] Transcribing audio...`);
  const result = await voiceService.transcribe(audioFile, {
    model,
    language,
    timestampGranularity
  });
  
  return { text: result.text };
}

export const description = "Transcribe audio using the active voice provider";

export const inputSchema = z.object({
  audioFile: z.any().describe("Audio file to transcribe"),
  model: z.string().optional().describe("Transcription model"),
  language: z.string().optional().describe("Language code"),
  timestampGranularity: z.string().optional().describe("Timestamp granularity"),
});