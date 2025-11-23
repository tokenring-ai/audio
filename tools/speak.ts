import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/types";
import {z} from "zod";
import AudioService from "../AudioService.js";

const name = "voice/speak";

async function execute(
  {
    text,
    model,
    voice,
    speed,
    format
  }: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<{ data: any }> {

  const voiceService = agent.requireServiceByType(AudioService);

  if (!text) {
    throw new Error(`[${name}] text is required`);
  }

  agent.infoLine(`[${name}] Converting text to speech...`);
  const result = await voiceService.speak(text, {
    model,
    voice,
    speed,
    format
  });

  return {data: result.data};
}

const description = "Convert text to speech using the active voice provider";

const inputSchema = z.object({
  text: z.string().min(1).describe("Text to convert to speech"),
  model: z.string().optional().describe("TTS model"),
  voice: z.string().optional().describe("Voice ID"),
  speed: z.number().optional().describe("Speech speed"),
  format: z.string().optional().describe("Audio format"),
});

export default {
  name, description, inputSchema, execute,
} as TokenRingToolDefinition<typeof inputSchema>;