import { AgentNotFoundSchema } from "@tokenring-ai/agent/schema";
import type { RPCSchema } from "@tokenring-ai/rpc/types";
import { z } from "zod";

export default {
  name: "Audio RPC",
  path: "/rpc/audio",
  methods: {
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