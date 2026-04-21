import { AgentCommandService } from "@tokenring-ai/agent";
import type { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { z } from "zod";
import AudioService from "./AudioService.ts";
import agentCommands from "./commands.ts";
import { AudioServiceConfigSchema } from "./index.ts";
import packageJSON from "./package.json" with { type: "json" };
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  audio: AudioServiceConfigSchema.exactOptional(),
});

export default {
  name: packageJSON.name,
  displayName: "Audio Framework",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (!config.audio) return;
    app.addServices(new AudioService(config.audio));
    app.waitForService(ChatService, chatService => chatService.addTools(...tools));
    app.waitForService(AgentCommandService, agentCommandService => agentCommandService.addAgentCommands(agentCommands));
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
