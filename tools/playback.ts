import Agent from "@tokenring-ai/agent/Agent";
import {z} from "zod";
import AudioService from "../AudioService.js";

export const name = "voice/playback";

export async function execute(
  {
    filename,
    sampleRate,
    channels
  }: {
    filename?: string;
    sampleRate?: number;
    channels?: number;
  },
  agent: Agent,
): Promise<{ filePath: string }> {
  
  const voiceService = agent.requireServiceByType(AudioService);

  if (!filename) {
    throw new Error(`[${name}] filename is required`);
  }

  agent.infoLine(`[${name}] Playing audio: ${filename}`);
  const result = await voiceService.playback(filename, {
    sampleRate,
    channels
  });
  
  return { filePath: result };
}

export const description = "Play audio file using the active voice provider";

export const inputSchema = z.object({
  filename: z.string().min(1).describe("Audio filename to play"),
  sampleRate: z.number().optional().describe("Sample rate for playback"),
  channels: z.number().optional().describe("Number of audio channels"),
});