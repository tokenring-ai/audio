import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import AudioService from "../AudioService.js";

const name = "voice_transcribe";

async function execute(
  {
    audioFile,
    language,
  }: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<{ text: string }> {

  const voiceService = agent.requireServiceByType(AudioService);

  if (!audioFile) {
    throw new Error(`[${name}] audioFile is required`);
  }

  agent.infoMessage(`[${name}] Transcribing audio...`);
  const result = await voiceService.convertAudioToText(audioFile, {
    language,
  }, agent);

  return {text: result.text};
}

const description = "Transcribe audio using the active voice provider";

const inputSchema = z.object({
  audioFile: z.any().describe("Audio file to transcribe"),
  language: z.string().describe("Language to transcribe the audio to"),
});

export default {
  name, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;