import {AgentTeam, TokenRingPackage} from "@tokenring-ai/agent";
import {z} from "zod";
import AudioService from "./AudioService.ts";
import * as chatCommands from "./chatCommands.ts";
import packageJSON from './package.json' with {type: 'json'};
import * as tools from "./tools.ts";

export const AudioConfigSchema = z.object({
  defaultProvider: z.string(),
  providers: z.record(z.string(), z.any())
}).optional();

export const packageInfo: TokenRingPackage = {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(agentTeam: AgentTeam) {
    const config = agentTeam.getConfigSlice('audio', AudioConfigSchema);
    if (config) {
      agentTeam.addTools(packageInfo, tools);
      agentTeam.addChatCommands(chatCommands);
      agentTeam.addServices(new AudioService());
    }
  },
  start(agentTeam: AgentTeam) {
    const config = agentTeam.getConfigSlice('audio', AudioConfigSchema);
    if (config?.defaultProvider) {
      agentTeam.services.requireItemByType(AudioService).setActiveProvider(config.defaultProvider);
    }
  }
};

export {default as AudioService} from "./AudioService.ts";
export {default as AudioProvider} from "./AudioProvider.ts";