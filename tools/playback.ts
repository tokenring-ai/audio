import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { z } from "zod";
import AudioService from "../AudioService.ts";

const name = "audio_playback";
const displayName = "Audio/playback";

async function execute({ filename }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const voiceService = agent.requireService(AudioService);
  const audioPath = voiceService.resolveAudioPath(filename, agent);
  agent.infoMessage(`[${name}] Playing audio: ${audioPath}`);
  const result = await voiceService.requireAudioProvider(agent).playback(audioPath);
  return {
    message: `**Audio** Played ${filename}`,
    result: `Played audio file: ${result}`,
  };
}

const description = "Play audio file using the active voice provider";

const inputSchema = z.object({
  filename: z.string().min(1).describe("Audio filename to play"),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
