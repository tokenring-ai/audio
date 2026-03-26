import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {AudioState} from "../../../../state/audioState.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const initialModel = agent.getState(AudioState).initialConfig.speech.model;
  if (!initialModel) throw new CommandFailedError("No initial model configured");
  agent.mutateState(AudioState, (state) => { state.speech.model = initialModel; });
  return `TTS model reset to ${initialModel}`;
}

const help = `Reset the TTS model to the initial configured value.

## Example

/audio model tts reset`;

export default {name: "audio model tts reset", description: "Reset TTS model", inputSchema, help, execute} satisfies TokenRingAgentCommand<typeof inputSchema>;
