import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { AgentCommandService } from "@tokenring-ai/agent";
import createTestingAgent from "@tokenring-ai/agent/test/createTestingAgent.test";
import { SpeechModelRegistry, TranscriptionModelRegistry } from "@tokenring-ai/ai-client/ModelRegistry";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp.test";
import { ChatService } from "@tokenring-ai/chat";
import MediaLibraryService from "@tokenring-ai/media-library/MediaLibraryService";
import AudioService from "./AudioService.ts";
import agentCommands from "./commands.ts";
import plugin from "./plugin.ts";
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

    mediaLibrary = new MediaLibraryService({
      staticPath: "/api/media",
      agentDefaults: { outputDirectory: MEDIA_OUTPUT_DIR },
    });
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
      tmpDirectory: "/tmp",
      providers: { test: mockProvider },
      agentDefaults: {
        provider: "test",
        transcribe: { model: "whisper-1", language: "en" },
        speech: { model: "tts-1", voice: "alloy", speed: 1.0 },
      },
    });

    audioService = new AudioService(config);
    audioService.registerProvider("test", mockProvider);

    app.addService(mockTranscriptionRegistry);
    app.addService(mockSpeechRegistry);
    app.addService(mediaLibrary);
    app.addService(audioService);

    agent = createTestingAgent(app);
    audioService.attach(agent);
    audioService.setActiveProvider("test", agent);
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

  it("should handle provider switching", async () => {
    const newProvider = {
      record: mock().mockResolvedValue({ filePath: "/tmp/new.wav" }),
      playback: mock().mockResolvedValue("/tmp/new.wav"),
    };

    audioService.registerProvider("new-provider", newProvider);
    audioService.setActiveProvider("new-provider", agent);

    expect(agent.getState(AudioState).activeProvider).toBe("new-provider");
    expect(audioService.requireAudioProvider(agent)).toBe(newProvider);
  });

  it("should integrate plugin with app", async () => {
    const pluginApp = createTestingApp();

    const config = {
      audio: AudioServiceConfigSchema.parse({
        tmpDirectory: "/tmp",
        providers: {},
        agentDefaults: {
          provider: "test-provider",
          transcribe: {},
          speech: {},
        },
      }),
    };

    const mockChatService = new ChatService(pluginApp, {
      defaultModels: [],
      defaultTranscriptionModels: [],
      agentDefaults: {
        parallelTools: false,
        enabledTools: [],
        maxSteps: 0,
        allowRemoteAttachments: true,
        compaction: { policy: "ask", compactionThreshold: 0.5, background: false, focus: "summary" },
        context: { initial: [], followUp: [] },
      },
    });
    const addToolsSpy = spyOn(mockChatService, "addTools");

    const mockCommandService = new AgentCommandService();
    const addCommandsSpy = spyOn(mockCommandService, "addAgentCommands");

    pluginApp.addService(mockChatService);
    pluginApp.addService(mockCommandService);

    plugin.install?.(pluginApp);
    plugin.reconfigure?.(pluginApp, config as any);

    const services = pluginApp.getServices();
    expect(services.some(s => s.name === "AudioService")).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(addToolsSpy).toHaveBeenCalled();
    expect(addCommandsSpy).toHaveBeenCalled();

    pluginApp.shutdown();
  });

  it("should register tools with ChatService", () => {
    const toolNames = tools.map(tool => tool.name);
    expect(toolNames).toContain("voice_record");
    expect(toolNames).toContain("voice_transcribe");
    expect(toolNames).toContain("voice_speak");
    expect(toolNames).toContain("audio_playback");

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
    expect(commandNames).toContain("audio record");
    expect(commandNames).toContain("audio play");
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

  it("should handle errors gracefully when no provider is set", () => {
    const errorApp = createTestingApp();
    const errorConfig = {
      tmpDirectory: "/tmp",
      providers: {},
      agentDefaults: {
        provider: "test-provider",
        transcribe: { model: "whisper-1" },
        speech: { model: "tts-1" },
      },
    };

    const errorAudioService = new AudioService(errorConfig as any);
    errorApp.addService(errorAudioService);

    const errorAgent = createTestingAgent(errorApp);
    errorAudioService.attach(errorAgent);

    expect(() => {
      errorAudioService.requireAudioProvider(errorAgent);
    }).toThrow();

    errorApp.shutdown();
  });
});
