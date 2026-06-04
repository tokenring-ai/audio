import { AgentManager } from "@tokenring-ai/agent";
import type TokenRingApp from "@tokenring-ai/app";
import MediaLibraryService from "@tokenring-ai/media-library/MediaLibraryService";
import { createRPCEndpoint } from "@tokenring-ai/rpc/createRPCEndpoint";
import AudioService from "../AudioService.ts";
import AudioRpcSchema from "./schema.ts";

export default createRPCEndpoint(AudioRpcSchema, {
  async getAudios(args, app: TokenRingApp) {
    const mediaLibrary = app.requireService(MediaLibraryService);
    const audios = await mediaLibrary.getEntriesFromDirectory(mediaLibrary.getDefaultOutputDirectory(), {
      kind: "audio",
      search: args.search,
    });
    const limitedAudios = audios.slice(0, args.limit ?? 200);

    return {
      audios: limitedAudios.map(audio => ({
        kind: "audio" as const,
        filename: audio.filename,
        mimeType: audio.mimeType,
        keywords: audio.keywords,
        ...(audio.duration !== undefined && { duration: audio.duration }),
        ...(audio.sampleRate !== undefined && { sampleRate: audio.sampleRate }),
        ...(audio.channels !== undefined && { channels: audio.channels }),
        ...(audio.prompt !== undefined && { prompt: audio.prompt }),
        ...(audio.createdAt !== undefined && { createdAt: audio.createdAt }),
      })),
      count: audios.length,
    };
  },

  async generateSpeech(args, app: TokenRingApp) {
    const agent = app.requireService(AgentManager).getAgent(args.agentId);
    if (!agent) {
      return { status: "agentNotFound" };
    }

    const audioService = app.requireService(AudioService);
    const result = await audioService.convertTextToSpeechFile(
      args.text,
      {
        voice: args.voice,
        speed: args.speed,
        keywords: args.keywords,
      },
      agent,
    );

    return {
      status: "success" as const,
      filename: result.fileName,
      mimeType: result.mediaType,
      message: `Generated: ${result.fileName}`,
    };
  },

  async transcribeAudio(args, app: TokenRingApp) {
    const agent = app.requireService(AgentManager).getAgent(args.agentId);
    if (!agent) {
      return { status: "agentNotFound" };
    }

    const audioService = app.requireService(AudioService);
    const result = await audioService.convertAudioToText(args.filename, { language: args.language }, agent);

    return {
      status: "success" as const,
      text: result.text,
    };
  },
});
