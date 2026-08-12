import fs from "node:fs";
import path from "node:path";
import type { Agent } from "@tokenring-ai/agent";
import type { TranscriptionResult } from "@tokenring-ai/ai-client/client/AITranscriptionClient";
import { SpeechModelRegistry, TranscriptionModelRegistry } from "@tokenring-ai/ai-client/ModelRegistry";
import type { TokenRingService } from "@tokenring-ai/app/types";
import { ConfigurationError } from "@tokenring-ai/app/types";
import MediaLibraryService from "@tokenring-ai/media-library/MediaLibraryService";
import deepClone from "@tokenring-ai/utility/object/deepClone";
import type { z } from "zod";
import { AudioAgentConfigSchema, type AudioServiceConfigSchema } from "./schema.ts";
import { AudioState } from "./state/audioState.ts";

export const AUDIO_FILE_EXTENSIONS = {
  wav: true,
  m4a: true,
  ogg: true,
  oga: true,
  flac: true,
  aac: true,
  mp3: true,
};

export type AudioFileExtension = keyof typeof AUDIO_FILE_EXTENSIONS;

function _extensionFromPath(filePath: string): AudioFileExtension {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  if (extension in AUDIO_FILE_EXTENSIONS) {
    return extension as AudioFileExtension;
  }

  throw new Error(`Unhandled audio file extension: ${extension}`);
}

function _audioMediaTypeFromExtension(extension: AudioFileExtension): string {
  switch (extension) {
    case "wav":
      return "audio/wav";
    case "m4a":
      return "audio/mp4";
    case "ogg":
    case "oga":
      return "audio/ogg";
    case "flac":
      return "audio/flac";
    case "aac":
      return "audio/aac";
    case "mp3":
      return "audio/mpeg";
    default: {
      const exhaustive: any = extension satisfies never;
      throw new Error(`Unhandled audio extension: ${exhaustive}`);
    }
  }
}

export interface AudioResult {
  data: Uint8Array<ArrayBufferLike>;
  mediaType?: string | undefined;
}

export default class AudioService implements TokenRingService {
  readonly name = "AudioService";
  description = "Audio recording, playback, speech, and transcription backed by the shared media library";

  private options: z.output<typeof AudioServiceConfigSchema> | undefined;

  constructor(options?: z.output<typeof AudioServiceConfigSchema>) {
    if (options) this.options = options;
  }

  reconfigure(options: z.output<typeof AudioServiceConfigSchema>): void {
    this.options = options;
  }

  attach(agent: Agent): void {
    if (!this.options) {
      throw new ConfigurationError(this.name, "Audio service has not been configured");
    }
    const agentConfig = deepClone(this.options.agentDefaults, agent.getAgentConfigSlice("audio", AudioAgentConfigSchema));
    agent.initializeState(AudioState, agentConfig);
  }

  async reindex(agent: Agent): Promise<void> {
    await agent.requireService(MediaLibraryService).reindex(agent, ["audio"]);
  }

  resolveAudioPath(filename: string, agent: Agent): string {
    if (filename.includes("/") || path.isAbsolute(filename)) return filename;
    return `${agent.requireService(MediaLibraryService).getOutputDirectory()}/${filename}`;
  }

  async saveAudioBuffer(
    buffer: Buffer,
    {
      mediaType = "audio/mpeg",
      extension,
      prompt,
      keywords,
      sampleRate,
      channels,
      duration,
    }: {
      mediaType?: string | undefined;
      extension?: string | undefined;
      prompt?: string | undefined;
      keywords?: string[] | undefined;
      sampleRate?: number | undefined;
      channels?: number | undefined;
      duration?: number | undefined;
    },
    agent: Agent,
  ): Promise<{ fileName: string; filePath: string; mediaType: string; buffer: Buffer }> {
    const media = await agent.requireService(MediaLibraryService).writeMedia(
      {
        kind: "audio",
        buffer,
        mimeType: mediaType,
        extension,
        keywords: keywords ?? [],
        ...(prompt && { prompt }),
        ...(sampleRate !== undefined && { sampleRate }),
        ...(channels !== undefined && { channels }),
        ...(duration !== undefined && { duration }),
      },
      agent,
    );

    return {
      fileName: media.filename,
      filePath: media.filePath,
      mediaType,
      buffer,
    };
  }

  async convertAudioToText(audioFile: string | Buffer, agent: Agent): Promise<TranscriptionResult> {
    const transcriptionModelRegistry = agent.requireService(TranscriptionModelRegistry);
    const { transcribe } = agent.getState(AudioState);
    const client = transcriptionModelRegistry.getClient(transcribe.model);

    const audioBuffer = typeof audioFile === "string" ? fs.readFileSync(this.resolveAudioPath(audioFile, agent)) : audioFile;

    const [text] = await client.transcribe(
      {
        audio: audioBuffer,
      },
      agent,
    );

    return { text };
  }

  async convertTextToSpeech(text: string, { voice, speed }: { voice?: string | undefined; speed?: number | undefined }, agent: Agent): Promise<AudioResult> {
    const speechModelRegistry = agent.requireService(SpeechModelRegistry);
    const { speech } = agent.getState(AudioState);
    const client = speechModelRegistry.getClient(speech.model);

    const [audioData] = await client.generateSpeech(
      {
        text,
        voice: voice ?? speech.voice,
        speed: speed ?? speech.speed,
      },
      agent,
    );

    return { data: audioData, mediaType: "audio/mpeg" };
  }

  async convertTextToSpeechFile(
    text: string,
    options: { voice?: string | undefined; speed?: number | undefined; keywords?: string[] | undefined },
    agent: Agent,
  ): Promise<{ fileName: string; filePath: string; mediaType: string; buffer: Buffer }> {
    const result = await this.convertTextToSpeech(text, options, agent);
    return this.saveAudioBuffer(
      Buffer.from(result.data),
      { mediaType: result.mediaType ?? "audio/mpeg", extension: "mp3", prompt: text, keywords: options.keywords },
      agent,
    );
  }
}
