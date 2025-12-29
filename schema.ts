import {z} from "zod";

export const AudioTranscriptionConfigSchema = z.object({
  model: z.string().default('whisper-1'),
  prompt: z.string().default('Convert the audio to english'),
  language: z.string().default('en'),
});

export const AudioSpeechConfigSchema = z.object({
  model: z.string().default('OpenAI:tts-1'),
  voice: z.string().default('alloy'),
  speed: z.number().default(1.0),
})

export const AudioConfigSchema = z.object({
  defaultProvider: z.string(),
  tmpDirectory: z.string().default('/tmp'),
  providers: z.record(z.string(), z.any())
});

export const AudioAgentConfigSchema = z.object({
  provider: z.string().optional(),
  transcribe: AudioTranscriptionConfigSchema.default(AudioTranscriptionConfigSchema.parse({})),
  speech: AudioSpeechConfigSchema.default(AudioSpeechConfigSchema.parse({}))
}).default({
  transcribe: AudioTranscriptionConfigSchema.parse({}),
  speech: AudioSpeechConfigSchema.parse({})
});