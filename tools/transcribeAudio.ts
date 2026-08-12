import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { z } from "zod";
import AudioService from "../AudioService.ts";

const name = "auto_transcribe";
const displayName = "Audio/Transcribe Audio";

async function execute({ audioFile }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const voiceService = agent.requireService(AudioService);
  agent.infoMessage(`[${name}] Transcribing audio...`);
  const result = await voiceService.convertAudioToText(audioFile, agent);
  return {
    message: "**Audio** Transcribed audio",
    result: `Transcription Results:\n${result.text}`,
  };
}

const description = "Transcribe audio to text";

const inputSchema = z.object({
  audioFile: z.any().describe("Audio file to transcribe"),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
