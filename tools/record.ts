import Agent from "@tokenring-ai/agent/Agent";
import {z} from "zod";
import AudioService from "../AudioService.js";

export const name = "voice/record";

export async function execute(
  {
    sampleRate,
    channels,
    format,
    timeout
  }: {
    sampleRate?: number;
    channels?: number;
    format?: string;
    timeout?: number;
  },
  agent: Agent,
): Promise<{ filePath: string }> {
  
  const voiceService = agent.requireServiceByType(AudioService);

  agent.infoLine(`[${name}] Starting recording...`);
  
  const abortController = new AbortController();
  // Set timeout if provided
  if (timeout) {
    setTimeout(() => abortController.abort(), timeout);
  }

  const result = await voiceService.record(abortController.signal, {
    sampleRate,
    channels,
    format
  });
  
  return { filePath: result.filePath };
}

export const description = "Record audio using the active voice provider";

export const inputSchema = z.object({
  sampleRate: z.number().optional().describe("Sample rate for recording"),
  channels: z.number().optional().describe("Number of audio channels"),
  format: z.string().optional().describe("Audio format"),
  timeout: z.number().optional().describe("Recording timeout in milliseconds"),
});