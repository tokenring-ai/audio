import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const initialModel = agent.getState(AudioState).initialConfig.transcribe.model;
  if (!initialModel) throw new CommandFailedError("No initial model configured");
  agent.mutateState(AudioState, (state) => { state.transcribe.model = initialModel; });
  return `STT model reset to ${initialModel}`;
}

const help = `Reset the STT model to the initial configured value.

## Example

/audio model stt reset`;

export default {name: "audio model stt reset", description: "Reset STT model", inputSchema, help, execute} satisfies TokenRingAgentCommand<typeof inputSchema>;
