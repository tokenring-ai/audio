import { AgentNotFoundSchema } from "@tokenring-ai/agent/schema";
import { MediaLibraryEntrySchema } from "@tokenring-ai/media-library/schema";
import type { RPCSchema } from "@tokenring-ai/rpc/types";
import { z } from "zod";

export const AudioIndexEntrySchema = MediaLibraryEntrySchema.extend({
  kind: z.literal("audio"),
});

export type AudioIndexEntry = z.output<typeof AudioIndexEntrySchema>;

export default {
  name: "Audio RPC",
  path: "/rpc/audio",
  methods: {
    getAudios: {
      type: "query",
      input: z.object({
        search: z.string().exactOptional(),
        limit: z.number().int().positive().default(200).exactOptional(),
      }),
      result: z.object({
        audios: z.array(AudioIndexEntrySchema),
        count: z.number(),
      }),
    },
    generateSpeech: {
      type: "mutation",
      input: z.object({
        agentId: z.string(),
        text: z.string(),
        voice: z.string().exactOptional(),
        speed: z.number().positive().exactOptional(),
        model: z.string().exactOptional(),
        keywords: z.array(z.string()).exactOptional(),
      }),
      result: z.discriminatedUnion("status", [
        z.object({
          status: z.literal("success"),
          filename: z.string(),
          mimeType: z.string(),
          message: z.string(),
        }),
        AgentNotFoundSchema,
      ]),
    },
    transcribeAudio: {
      type: "mutation",
      input: z.object({
        agentId: z.string(),
        filename: z.string(),
        language: z.string().exactOptional(),
      }),
      result: z.discriminatedUnion("status", [
        z.object({
          status: z.literal("success"),
          text: z.string(),
        }),
        AgentNotFoundSchema,
      ]),
    },
  },
} satisfies RPCSchema;
