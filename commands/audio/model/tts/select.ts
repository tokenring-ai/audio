import type {TreeLeaf} from "@tokenring-ai/agent/question";
import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import {SpeechModelRegistry} from "@tokenring-ai/ai-client/ModelRegistry";
import {AudioState} from "../../../../state/audioState.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({
                         agent,
                       }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const modelsByProvider = await agent.busyWithActivity(
    "Checking online status of models...",
    agent.requireServiceByType(SpeechModelRegistry).getModelsByProvider(),
  );

  const tree: TreeLeaf[] = Object.entries(modelsByProvider)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([provider, providerModels]) => {
      const sorted = Object.entries(providerModels).sort(([, a], [, b]) =>
        a.status === b.status
          ? a.modelSpec.modelId.localeCompare(b.modelSpec.modelId)
          : a.status.localeCompare(b.status),
      );
      const onlineCount = Object.values(providerModels).filter(
        (m) => m.status === "online",
      ).length;
      return {
        name: `${provider} (${onlineCount}/${Object.keys(providerModels).length} online)`,
        children: sorted.map(([modelName, model]) => ({
          value: modelName,
          name:
            model.status === "online"
              ? model.modelSpec.modelId
              : `${model.modelSpec.modelId} (${model.status})`,
        })),
      };
    });

  const selection = await agent.askQuestion({
    message: "Choose a Text to Speech model:",
    question: {
      type: "treeSelect",
      label: "Model Selection",
      key: "result",
      minimumSelections: 1,
      maximumSelections: 1,
      tree,
    },
  });

  if (selection !== null) {
    agent.mutateState(AudioState, (state) => {
      state.speech.model = selection[0];
    });
    return `TTS model set to ${selection[0]}`;
  }
  return "Model selection cancelled. No changes made.";
}

const help = `Open an interactive tree-based selector to choose the TTS model. Models are grouped by provider with availability status.

## Example

/audio model tts select

## Notes

- ✅ Online - Ready for immediate use
- 🧊 Cold - May have startup delay
- 🔴 Offline - Currently unavailable`;

export default {
  name: "audio model tts select",
  description: "Interactive TTS model selection",
  inputSchema,
  help,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
