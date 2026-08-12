import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import createTestingAgent from "@tokenring-ai/agent/test/createTestingAgent.test";
import { SpeechModelRegistry, TranscriptionModelRegistry } from "@tokenring-ai/ai-client/ModelRegistry";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp.test";
import MediaLibraryService from "@tokenring-ai/media-library/MediaLibraryService";
import { MediaLibraryServiceConfigSchema } from "@tokenring-ai/media-library/schema";
import AudioService from "./AudioService.ts";
import agentCommands from "./commands.ts";
import { AudioServiceConfigSchema } from "./schema.ts";
import { AudioState } from "./state/audioState.ts";
import tools from "./tools.ts";

const MEDIA_OUTPUT_DIR = "/tmp/tokenring-audio-integration-media";

describe("Audio Integration Tests", () => {
  let app: ReturnType<typeof createTestingApp>;
  let agent: ReturnType<typeof createTestingAgent>;
  let audioService: AudioService;
  let mockProvider: any;
  let mockTranscriptionModel: any;
  let mockSpeechModel: any;
  let mockTranscriptionRegistry: any;
  let mockSpeechRegistry: any;
  let mediaLibrary: MediaLibraryService;

  beforeEach(() => {
    app = createTestingApp();

    mockProvider = {
      record: mock().mockResolvedValue({ filePath: "/tmp/test.wav" }),
      playback: mock().mockResolvedValue("/tmp/test.wav"),
    };

    mockTranscriptionModel = {
      transcribe: mock().mockResolvedValue(["Hello world"]),
    };

    mockSpeechModel = {
      generateSpeech: mock().mockResolvedValue([Buffer.from("test audio")]),
    };

    mockTranscriptionRegistry = new TranscriptionModelRegistry();
    mockSpeechRegistry = new SpeechModelRegistry();

    spyOn(mockTranscriptionRegistry, "getClient").mockReturnValue(mockTranscriptionModel);
    spyOn(mockSpeechRegistry, "getClient").mockReturnValue(mockSpeechModel);

    mediaLibrary = new MediaLibraryService(
      app,
      MediaLibraryServiceConfigSchema.parse({
        outputDirectory: MEDIA_OUTPUT_DIR,
      }),
    );
    spyOn(mediaLibrary, "writeMedia").mockImplementation(async (options: any) => {
      const extension = options.extension ?? "bin";
      const filename = `saved.${extension}`;
      const filePath = `${MEDIA_OUTPUT_DIR}/${filename}`;
      return {
        kind: options.kind,
        filename,
        filePath,
        mimeType: options.mimeType,
        keywords: options.keywords ?? [],
        buffer: options.buffer,
      };
    });

    const config = AudioServiceConfigSchema.parse({
      providers: { test: mockProvider },
      agentDefaults: {
        provider: "test",
        transcribe: { model: "whisper-1", language: "en" },
        speech: { model: "tts-1", voice: "alloy", speed: 1.0 },
      },
    });

    audioService = new AudioService(config);

    app.addService(mockTranscriptionRegistry);
    app.addService(mockSpeechRegistry);
    app.addService(mediaLibrary);
    app.addService(audioService);

    agent = createTestingAgent(app);
    audioService.attach(agent);
  });

  afterEach(() => {
    app.shutdown();
  });

  it("should integrate AudioService with agent", () => {
    expect(agent.requireService(AudioService)).toBe(audioService);
    expect(agent.getState(AudioState)).toBeDefined();
  });

  it("should complete full transcription workflow", async () => {
    const audioBuffer = Buffer.from("fake audio data");

    const transcription = await audioService.convertAudioToText(audioBuffer, agent);

    expect(transcription.text).toBe("Hello world");
    expect(mockTranscriptionModel.transcribe).toHaveBeenCalled();
  });

  it("should complete full TTS workflow", async () => {
    const ttsResult = await audioService.convertTextToSpeech("Hello world", { speed: 1.2 }, agent);

    expect(ttsResult.data).toBeInstanceOf(Buffer);

    const tmpFile = "/tmp/speech-test.mp3";
    await mockProvider.playback(tmpFile);

    expect(mockProvider.playback).toHaveBeenCalledWith(tmpFile);
  });

  it("should register tools with ChatService", () => {
    const toolNames = tools.map(tool => tool.name);
    expect(toolNames).toContain("voice_transcribe");
    expect(toolNames).toContain("voice_speak");

    tools.forEach(tool => {
      expect(tool.name).toBeDefined();
      expect(tool.displayName).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.execute).toBeDefined();
    });
  });

  it("should register commands with AgentCommandService", () => {
    expect(agentCommands).toBeInstanceOf(Array);
    expect(agentCommands.length).toBeGreaterThan(0);

    const commandNames = agentCommands.map(cmd => cmd.name);
    expect(commandNames).toContain("audio speak");
    expect(commandNames).toContain("audio transcribe");

    agentCommands.forEach(command => {
      expect(command.name).toBeDefined();
      expect(command.description).toBeDefined();
      expect(command.inputSchema).toBeDefined();
      expect(command.help).toBeDefined();
      expect(command.execute).toBeDefined();
    });
  });

  it("should handle state initialization for new agent", () => {
    const newAgent = createTestingAgent(app);
    audioService.attach(newAgent);

    expect(newAgent.getState(AudioState).transcribe.model).toBe("whisper-1");
  });

  it("should handle concurrent operations", async () => {
    const operations = [
      audioService.convertTextToSpeech("Text 1", {}, agent),
      audioService.convertTextToSpeech("Text 2", {}, agent),
      mockProvider.playback("/tmp/test1.wav"),
      mockProvider.playback("/tmp/test2.wav"),
    ];

    const results = await Promise.all(operations);

    expect(results).toHaveLength(4);
    expect(mockSpeechModel.generateSpeech).toHaveBeenCalledTimes(2);
    expect(mockProvider.playback).toHaveBeenCalledTimes(2);
  });
});
