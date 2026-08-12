import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { ToolCallError } from "@tokenring-ai/chat/util/tokenRingTool";
import { z } from "zod";
import AudioService from "../AudioService.ts";

const name = "audio_generate";
const displayName = "Audio/Generate Audio";

async function execute(
  {
    text,
    //voice,
    speed,
    keywords,
  }: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolResult> {
  const audioService = agent.requireService(AudioService);

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

  return {
    message: `**Audio** Generated audio file ${result.fileName}`,
    result: JSON.stringify({ path: result.filePath, fileName: result.fileName, mediaType: result.mediaType }),
  };
}

const description = "Convert text to an audio file, which will be saved to a new file on the filesystem";

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
