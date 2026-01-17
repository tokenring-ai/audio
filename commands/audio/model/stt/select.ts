import {Agent} from "@tokenring-ai/agent";
import type {TreeLeaf} from "@tokenring-ai/agent/question";
import {TranscriptionModelRegistry} from "@tokenring-ai/ai-client/ModelRegistry";
import {AudioState} from "../../../../state/audioState.js";

export default async function select(_remainder: string, agent: Agent): Promise<void> {
  const transcriptionModelRegistry = agent.requireServiceByType(TranscriptionModelRegistry);

  const modelsByProvider = await agent.busyWhile(
    "Checking online status of models...",
    transcriptionModelRegistry.getModelsByProvider(),
  );

  const buildModelTree = (): TreeLeaf[] => {
    const roots: TreeLeaf[] = [];

    const sortedProviders = Object.entries(modelsByProvider).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    for (const [provider, providerModels] of sortedProviders) {
      const sortedModels = Object.entries(providerModels).sort(
        ([, a], [, b]) => {
          if (a.status === b.status) {
            return a.modelSpec.modelId.localeCompare(b.modelSpec.modelId);
          } else {
            return a.status.localeCompare(b.status);
          }
        },
      );

      const children = sortedModels.map(([modelName, model]) => ({
        value: modelName,
        name:
          model.status === "online"
            ? model.modelSpec.modelId
            : model.status === "cold"
              ? `${model.modelSpec.modelId} (cold)`
              : `${model.modelSpec.modelId} (offline)`,
      }));

      const onlineCount = Object.values(providerModels).filter(
        (m) => m.status === "online",
      ).length;
      const totalCount = Object.keys(providerModels).length;

      roots.push({
        name: `${provider} (${onlineCount}/${totalCount} online)`,
        children,
      });
    }

    return roots;
  };

  const selection = await agent.askQuestion({
    message: "Choose a Speech to Text model:",
    question: {
      type: 'treeSelect',
      label: "Model Selection",
      key: "result",
      minimumSelections: 1,
      maximumSelections: 1,
      tree: buildModelTree(),
    }
  });

  if (selection !== null && selection.length > 0) {
    const selectedModel = selection[0];
    agent.mutateState(AudioState, (state) => {
      state.transcribe.model = selectedModel;
    });
    agent.infoMessage(`STT model set to ${selectedModel}`);
  } else {
    agent.infoMessage("Model selection cancelled. No changes made.");
  }
}
