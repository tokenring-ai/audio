import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/types";
import {z} from "zod";
import AudioService from "../AudioService.js";

const name = "voice/transcribe";

async function execute(
  {
    audioFile,
    model,
    language,
    timestampGranularity
  }: z.infer<typeof inputSchema>,
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

  return {text: result.text};
}

const description = "Transcribe audio using the active voice provider";

const inputSchema = z.object({
  audioFile: z.any().describe("Audio file to transcribe"),
  model: z.string().optional().describe("Transcription model"),
  language: z.string().optional().describe("Language code"),
  timestampGranularity: z.string().optional().describe("Timestamp granularity"),
});

export default {
  name, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;