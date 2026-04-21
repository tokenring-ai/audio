import fs from "node:fs";
import path from "node:path";
import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { z } from "zod";
import AudioService from "../AudioService.ts";

const name = "voice_speak";
const displayName = "Audio/speak";

async function execute(
  {
    text,
    //voice,
    speed,
  }: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolResult> {
  const audioService = agent.requireServiceByType(AudioService);

  if (!text) {
    throw new Error(`[${name}] text is required`);
  }

  agent.infoMessage(`[${name}] Converting text to speech...`);
  const result = await audioService.convertTextToSpeech(
    text,
    {
      //voice,
      speed,
    },
    agent,
  );

  const tmpFile = path.join(audioService.options.tmpDirectory, `speech-${Date.now()}.mp3`);
  fs.writeFileSync(tmpFile, result.data);

  await audioService.requireAudioProvider(agent).playback(tmpFile);

  return `Playback succeeded`;
}

const description = "Convert text to speech using the active voice provider";

const inputSchema = z.object({
  text: z.string().min(1).describe("Text to convert to speech"),
  //voice: z.string().exactOptional().describe("Voice ID"),
  speed: z.number().exactOptional().describe("Speech speed"),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
