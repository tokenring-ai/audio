import { AgentManager } from "@tokenring-ai/agent";
import type TokenRingApp from "@tokenring-ai/app";
import { createRPCEndpoint } from "@tokenring-ai/rpc/createRPCEndpoint";
import AudioService from "../AudioService.ts";
import AudioRpcSchema from "./schema.ts";

export default createRPCEndpoint(AudioRpcSchema, {
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
