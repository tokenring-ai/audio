import type Agent from "@tokenring-ai/agent/Agent";
import type {TokenRingToolDefinition, TokenRingToolResult} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import AudioService from "../AudioService.ts";

const name = "voice_record";
const displayName = "Audio/record";

async function execute(
  {sampleRate, channels, format, timeout}: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolResult> {
  const voiceService = agent.requireServiceByType(AudioService);
  agent.infoMessage(`[${name}] Starting recording...`);

  const abortController = new AbortController();
  if (timeout) {
    setTimeout(() => abortController.abort(), timeout);
  }

  const result = await voiceService
    .requireAudioProvider(agent)
    .record(abortController.signal, {
      sampleRate,
      channels,
      format,
    });

  return `Recorded audio to: ${result.filePath}`;
}

const description = "Record audio using the active voice provider";

const inputSchema = z.object({
  sampleRate: z.number().optional().describe("Sample rate for recording"),
  channels: z.number().optional().describe("Number of audio channels"),
  format: z.string().optional().describe("Audio format"),
  timeout: z.number().optional().describe("Recording timeout in milliseconds"),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
