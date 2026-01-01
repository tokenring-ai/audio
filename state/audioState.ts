import {Agent} from "@tokenring-ai/agent";
import type {ResetWhat} from "@tokenring-ai/agent/AgentEvents";
import type {AgentStateSlice} from "@tokenring-ai/agent/types";
import {z} from "zod";
import {
  AudioServiceConfigSchema,
  AudioSpeechConfigSchema,
  AudioTranscriptionConfigSchema
} from "../schema.ts";

export class AudioState implements AgentStateSlice {
  name = "AudioState";
  activeProvider: string | null;
  transcribe: z.output<typeof AudioTranscriptionConfigSchema>;
  speech: z.output<typeof AudioSpeechConfigSchema>;

  constructor(readonly initialConfig: z.output<typeof AudioServiceConfigSchema>["agentDefaults"]) {
    this.activeProvider = initialConfig.provider ?? null;
    this.transcribe = initialConfig.transcribe;
    this.speech = initialConfig.speech;
  }

  transferStateFromParent(parent: Agent): void {
    const parentState = parent.getState(AudioState);
    this.activeProvider = parentState.activeProvider;
    this.transcribe = parentState.transcribe;
    this.speech = parentState.speech;
  }

  reset(what: ResetWhat[]): void {}

  serialize(): object {
    return {
      activeProvider: this.activeProvider,
      transcribe: this.transcribe,
      speech: this.speech
    };
  }

  deserialize(data: any): void {
    this.activeProvider = data.activeProvider;
    this.transcribe = data.transcribe;
    this.speech = data.speech;
  }

  show(): string[] {
    return [
      `Active Provider: ${this.activeProvider}`,
      `Transcription Model: ${this.transcribe?.model ?? ''}`,
      `Transcription Prompt: ${this.transcribe?.prompt ?? ''}`,
      `Transcription Language: ${this.transcribe?.language ?? ''}`,
      `Speech Model: ${this.speech?.model ?? ''}`,
      `Speech Voice: ${this.speech?.voice ?? ''}`,
      `Speech Speed: ${this.speech?.speed ?? ''}`,
    ];
  }
}
