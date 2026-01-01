import {AgentCommandService} from "@tokenring-ai/agent";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {z} from "zod";
import AudioService from "./AudioService.ts";
import chatCommands from "./chatCommands.ts";
import {AudioServiceConfigSchema} from "./index.ts";
import packageJSON from './package.json' with {type: 'json'};
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  audio: AudioServiceConfigSchema.optional(),
})


export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (! config.audio) return;
    app.addServices(new AudioService(config.audio));
    app.waitForService(ChatService, chatService =>
      chatService.addTools(packageJSON.name, tools)
    );
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(chatCommands)
    );
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
