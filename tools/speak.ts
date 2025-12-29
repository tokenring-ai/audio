import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/types";
import fs from "node:fs";
import path from "path";
import {z} from "zod";
import AudioService from "../AudioService.js";

const name = "voice_speak";

async function execute(
  {
    text,
    //voice,
    speed,
  }: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<string> {

  const audioService = agent.requireServiceByType(AudioService);

  if (!text) {
    throw new Error(`[${name}] text is required`);
  }

  agent.infoLine(`[${name}] Converting text to speech...`);
  const result = await audioService.convertTextToSpeech(text, {
    //voice,
    speed,
  }, agent);

  const tmpFile = path.join(audioService.options.tmpDirectory, `speech-${Date.now()}.mp3`);
  fs.writeFileSync(tmpFile, result.data);

  await audioService.getActiveProvider(agent).playback(tmpFile);

  return "Playback succeeded";
}

const description = "Convert text to speech using the active voice provider";

const inputSchema = z.object({
  text: z.string().min(1).describe("Text to convert to speech"),
  //voice: z.string().optional().describe("Voice ID"),
  speed: z.number().optional().describe("Speech speed"),
});

export default {
  name, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;