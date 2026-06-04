import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import MediaLibraryService from "@tokenring-ai/media-library/MediaLibraryService";
import { z } from "zod";

const name = "audio_search";
const displayName = "Audio/search";

async function execute({ query, limit = 10 }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const mediaLibrary = agent.requireServiceByType(MediaLibraryService);
  const results = await mediaLibrary.search(query, { kind: "audio", limit }, agent);

  return JSON.stringify({
    results,
    message: `Found ${results.length} audio files matching "${query}"`,
  });
}

const description = "Search for audio files in the media library by filename, prompt, or keywords";

const inputSchema = z.object({
  query: z.string().describe("Search query to match against audio metadata"),
  limit: z.number().int().positive().default(10).describe("Maximum number of results to return").exactOptional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
