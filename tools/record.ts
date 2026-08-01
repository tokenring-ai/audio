import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { z } from "zod";
import AudioService from "../AudioService.ts";

const name = "voice_record";
const displayName = "Audio/record";

async function execute({ sampleRate, channels, format, timeout, keywords }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const voiceService = agent.requireService(AudioService);
  agent.infoMessage(`[${name}] Starting recording...`);

  const abortController = new AbortController();
  if (timeout) {
    setTimeout(() => abortController.abort(), timeout);
  }

  const result = await voiceService.recordAudio({ sampleRate, channels, format, keywords }, agent, abortController.signal);

  return {
    message: "**Audio** Recorded audio",
    result: JSON.stringify({ path: result.filePath, fileName: result.fileName, mediaType: result.mediaType }),
  };
}

const description = "Record audio using the active voice provider and save it to the media library";

const inputSchema = z.object({
  sampleRate: z.number().exactOptional().describe("Sample rate for recording"),
  channels: z.number().exactOptional().describe("Number of audio channels"),
  format: z.string().exactOptional().describe("Audio format"),
  timeout: z.number().exactOptional().describe("Recording timeout in milliseconds"),
  keywords: z.array(z.string()).describe("Keywords to add to media library metadata").exactOptional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
