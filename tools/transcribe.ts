import type Agent from "@tokenring-ai/agent/Agent";
import type {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import AudioService from "../AudioService.ts";

const name = "voice_transcribe";
const displayName = "Audio/transcribe";

async function execute(
  {audioFile, language}: z.output<typeof inputSchema>,
  agent: Agent,
) {
  const voiceService = agent.requireServiceByType(AudioService);
  agent.infoMessage(`[${name}] Transcribing audio...`);
  const result = await voiceService.convertAudioToText(
    audioFile,
    {
      language,
    },
    agent,
  );
  return result.text;
}

const description = "Transcribe audio using the active voice provider";

const inputSchema = z.object({
  audioFile: z.any().describe("Audio file to transcribe"),
  language: z.string().describe("Language to transcribe the audio to"),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
