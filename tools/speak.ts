import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { ToolCallError } from "@tokenring-ai/chat/util/tokenRingTool";
import { z } from "zod";
import AudioService from "../AudioService.ts";

const name = "voice_speak";
const displayName = "Audio/speak";

async function execute(
  {
    text,
    //voice,
    speed,
    keywords,
  }: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolResult> {
  const audioService = agent.requireServiceByType(AudioService);

  if (!text) {
    throw new ToolCallError(name, `text is required`);
  }

  agent.infoMessage(`[${name}] Converting text to speech...`);
  const result = await audioService.convertTextToSpeechFile(
    text,
    {
      //voice,
      speed,
      keywords,
    },
    agent,
  );

  await audioService.requireAudioProvider(agent).playback(result.filePath);

  return {
    message: "**Audio** Spoke text",
    result: JSON.stringify({ path: result.filePath, fileName: result.fileName, mediaType: result.mediaType }),
  };
}

const description = "Convert text to speech, save it to the media library, and play it using the active audio provider";

const inputSchema = z.object({
  text: z.string().min(1).describe("Text to convert to speech"),
  //voice: z.string().exactOptional().describe("Voice ID"),
  speed: z.number().exactOptional().describe("Speech speed"),
  keywords: z.array(z.string()).describe("Keywords to add to media library metadata").exactOptional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
