import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import AudioService from "../AudioService.js";

const name = "voice_playback";

async function execute(
  {
    filename,
  }: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<{ filePath: string }> {

  const voiceService = agent.requireServiceByType(AudioService);

  if (!filename) {
    throw new Error(`[${name}] filename is required`);
  }

  agent.infoMessage(`[${name}] Playing audio: ${filename}`);
  const result = await voiceService.requireAudioProvider(agent).playback(filename);

  return {filePath: result};
}

const description = "Play audio file using the active voice provider";

const inputSchema = z.object({
  filename: z.string().min(1).describe("Audio filename to play"),
});

export default {
  name, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;