import type { Agent } from "@tokenring-ai/agent";
import { AgentStateSlice } from "@tokenring-ai/agent/types";
import deepClone from "@tokenring-ai/utility/object/deepClone";
import markdownList from "@tokenring-ai/utility/string/markdownList";
import { z } from "zod";
import { type AudioServiceConfigSchema, AudioSpeechConfigSchema, AudioTranscriptionConfigSchema } from "../schema.ts";

const serializationSchema = z.object({
  activeProvider: z.string().nullable(),
  transcribe: AudioTranscriptionConfigSchema,
  speech: AudioSpeechConfigSchema,
});

export class AudioState extends AgentStateSlice<typeof serializationSchema> {
  activeProvider: string | null;
  transcribe: z.output<typeof AudioTranscriptionConfigSchema>;
  speech: z.output<typeof AudioSpeechConfigSchema>;

  constructor(readonly initialConfig: z.output<typeof AudioServiceConfigSchema>["agentDefaults"]) {
    super("AudioState", serializationSchema);
    this.activeProvider = initialConfig.provider;
    this.transcribe = deepClone(initialConfig.transcribe);
    this.speech = deepClone(initialConfig.speech);
  }

  transferStateFromParent(parent: Agent): void {
    const parentState = parent.getState(AudioState);
    this.activeProvider = parentState.activeProvider;
    this.transcribe = deepClone(parentState.transcribe);
    this.speech = deepClone(parentState.speech);
  }

  serialize(): z.output<typeof serializationSchema> {
    return {
      activeProvider: this.activeProvider,
      transcribe: this.transcribe,
      speech: this.speech,
    };
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.activeProvider = data.activeProvider;
    this.transcribe = data.transcribe;
    this.speech = data.speech;
  }

  show(): string {
    return `Active Provider: ${this.activeProvider}
${markdownList([
  `Transcription Model: ${this.transcribe.model}`,
  `Transcription Prompt: ${this.transcribe.prompt}`,
  `Transcription Language: ${this.transcribe.language}`,
  `Speech Model: ${this.speech.model}`,
  `Speech Voice: ${this.speech.voice}`,
  `Speech Speed: ${this.speech.speed}`,
])}`;
  }
}
