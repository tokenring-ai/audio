import {AgentCommandService, AgentTeam, TokenRingPackage} from "@tokenring-ai/agent";
import {AIService} from "@tokenring-ai/ai-client";
import {z} from "zod";
import AudioService from "./AudioService.ts";
import * as chatCommands from "./chatCommands.ts";
import packageJSON from './package.json' with {type: 'json'};
import * as tools from "./tools.ts";

export const AudioConfigSchema = z.object({
  defaultProvider: z.string(),
  providers: z.record(z.string(), z.any())
}).optional();

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(agentTeam: AgentTeam) {
    const config = agentTeam.getConfigSlice('audio', AudioConfigSchema);
    if (config) {
      agentTeam.waitForService(AIService, aiService =>
        aiService.addTools(packageJSON.name, tools)
      );
      agentTeam.waitForService(AgentCommandService, agentCommandService =>
        agentCommandService.addAgentCommands(chatCommands)
      );
      agentTeam.addServices(new AudioService());
    }
  },
  start(agentTeam: AgentTeam) {
    const config = agentTeam.getConfigSlice('audio', AudioConfigSchema);
    if (config?.defaultProvider) {
      agentTeam.requireService(AudioService).setActiveProvider(config.defaultProvider);
    }
  }
} as TokenRingPackage;

export {default as AudioService} from "./AudioService.ts";
export {default as AudioProvider} from "./AudioProvider.ts";