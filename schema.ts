import type { ConfigFieldMeta } from "@tokenring-ai/app/config/metadata";
import { z } from "zod";

export const AudioTranscriptionConfigSchema = z.object({
  model: z
    .string()
    .default("whisper-1")
    .meta({ description: "Model used for speech-to-text transcription" } satisfies ConfigFieldMeta),
  prompt: z
    .string()
    .default("Convert the audio to english")
    .meta({ uiType: "multilineText", advanced: true, description: "Prompt hint passed to the transcription model" } satisfies ConfigFieldMeta),
  language: z
    .string()
    .default("en")
    .meta({ description: "Expected spoken language" } satisfies ConfigFieldMeta),
});

export const AudioSpeechConfigSchema = z.object({
  model: z
    .string()
    .default("OpenAI:tts-1")
    .meta({ description: "Model used for text-to-speech" } satisfies ConfigFieldMeta),
  voice: z
    .string()
    .default("alloy")
    .meta({ description: "Voice preset used for speech synthesis" } satisfies ConfigFieldMeta),
  speed: z
    .number()
    .default(1.0)
    .meta({ advanced: true, description: "Playback speed multiplier" } satisfies ConfigFieldMeta),
});

export const AudioAgentConfigSchema = z
  .object({
    transcribe: AudioTranscriptionConfigSchema.exactOptional(),
    speech: AudioSpeechConfigSchema.exactOptional(),
  })
  .prefault({});

export const AudioAgentDefaultsSchema = z
  .object({
    transcribe: AudioTranscriptionConfigSchema.prefault({}).meta({ label: "Transcription" } satisfies ConfigFieldMeta),
    speech: AudioSpeechConfigSchema.prefault({}).meta({ label: "Speech" } satisfies ConfigFieldMeta),
  })
  .prefault({});

export const AudioServiceConfigSchema = z
  .object({
    agentDefaults: AudioAgentDefaultsSchema.meta({ label: "Agent Defaults" } satisfies ConfigFieldMeta),
  })
  .prefault({})
  .meta({ label: "Audio", description: "Speech-to-text and text-to-speech settings" } satisfies ConfigFieldMeta);
