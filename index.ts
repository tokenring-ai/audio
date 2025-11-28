import TokenRingApp from "@tokenring-ai/app"; 
import {AgentCommandService} from "@tokenring-ai/agent";
import {ChatService} from "@tokenring-ai/chat";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {z} from "zod";
import AudioService from "./AudioService.ts";
import chatCommands from "./chatCommands.ts";
import packageJSON from './package.json' with {type: 'json'};
import tools from "./tools.ts";

export const AudioConfigSchema = z.object({
  defaultProvider: z.string(),
  providers: z.record(z.string(), z.any())
}).optional();

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {
    const config = app.getConfigSlice('audio', AudioConfigSchema);
    if (config) {
      app.waitForService(ChatService, chatService =>
        chatService.addTools(packageJSON.name, tools)
      );
      app.waitForService(AgentCommandService, agentCommandService =>
        agentCommandService.addAgentCommands(chatCommands)
      );
      app.addServices(new AudioService());
    }
  },
  start(app: TokenRingApp) {
    const config = app.getConfigSlice('audio', AudioConfigSchema);
    if (config?.defaultProvider) {
      app.requireService(AudioService).setActiveProvider(config.defaultProvider);
    }
  }
} as TokenRingPlugin;

export {default as AudioService} from "./AudioService.ts";
export {default as AudioProvider} from "./AudioProvider.ts";