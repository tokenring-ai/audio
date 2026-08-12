import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import fs from "node:fs";
import createTestingAgent from "@tokenring-ai/agent/test/createTestingAgent.test";
import { SpeechModelRegistry, TranscriptionModelRegistry } from "@tokenring-ai/ai-client/ModelRegistry";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp.test";
import MediaLibraryService from "@tokenring-ai/media-library/MediaLibraryService";
import { MediaLibraryServiceConfigSchema } from "@tokenring-ai/media-library/schema";
import AudioService from "./AudioService.ts";
import speakTool from "./tools/generateAudio.ts";
import transcribeTool from "./tools/transcribeAudio.ts";

const TEST_WAV_PATH = "/tmp/tokenring-audio-tools-test.wav";
const MEDIA_OUTPUT_DIR = "/tmp/tokenring-audio-tools-media";

describe("Audio Tools", () => {
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
    fs.writeFileSync(TEST_WAV_PATH, Buffer.from("RIFF....WAVEfmt "));

    mockProvider = {
      record: mock().mockResolvedValue({ filePath: TEST_WAV_PATH }),
      playback: mock().mockResolvedValue(TEST_WAV_PATH),
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

    const config = {
      providers: { test: mockProvider },
      agentDefaults: {
        provider: "test",
        transcribe: { model: "whisper-1", language: "en" },
        speech: { model: "tts-1", voice: "alloy", speed: 1.0 },
      },
    };

    audioService = new AudioService(config as any);

    app.addService(mockTranscriptionRegistry);
    app.addService(mockSpeechRegistry);
    app.addService(mediaLibrary);
    app.addService(audioService);

    agent = createTestingAgent(app);
    audioService.attach(agent);
  });

  afterEach(() => {
    app.shutdown();
    try {
      fs.unlinkSync(TEST_WAV_PATH);
    } catch {
      // ignore
    }
  });

  describe("transcribe tool", () => {
    it("should have correct metadata", () => {
      expect(transcribeTool.name).toBe("voice_transcribe");
      expect(transcribeTool.displayName).toBe("Audio/transcribe");
      expect(transcribeTool.description).toBe("Transcribe audio using the active voice provider");
    });

    it("should transcribe audio file", async () => {
      const audioBuffer = Buffer.from("fake audio data");
      const result = await transcribeTool.execute({ audioFile: audioBuffer }, agent);

      expect(result.message).toBe("**Audio** Transcribed audio");
      expect(result.result).toBe("Transcription Results:\nHello world");
      expect(mockTranscriptionModel.transcribe).toHaveBeenCalled();
    });

    it("should pass audio buffer to transcription client", async () => {
      const audioBuffer = Buffer.from("fake audio data");
      await transcribeTool.execute({ audioFile: audioBuffer }, agent);

      expect(mockTranscriptionModel.transcribe).toHaveBeenCalledWith(expect.objectContaining({ audio: audioBuffer }), agent);
    });

    it("should call infoMessage when transcribing", async () => {
      const audioBuffer = Buffer.from("fake audio data");
      const infoSpy = spyOn(agent, "infoMessage");

      await transcribeTool.execute({ audioFile: audioBuffer }, agent);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("[voice_transcribe]"));
    });
  });

  describe("speak tool", () => {
    it("should have correct metadata", () => {
      expect(speakTool.name).toBe("voice_speak");
      expect(speakTool.displayName).toBe("Audio/speak");
      expect(speakTool.description).toBe("Convert text to speech, save it to the media library, and play it using the active audio provider");
    });

    it("should convert text to speech", async () => {
      const result = await speakTool.execute({ text: "Hello world" }, agent);

      expect(result.message).toBe("**Audio** Spoke text");
      const parsed = JSON.parse(result.result);
      expect(parsed.path).toBe(`${MEDIA_OUTPUT_DIR}/saved.mp3`);
      expect(parsed.fileName).toBe("saved.mp3");
      expect(parsed.mediaType).toBe("audio/mpeg");
      expect(mockSpeechModel.generateSpeech).toHaveBeenCalled();
      expect(mockProvider.playback).toHaveBeenCalledWith(`${MEDIA_OUTPUT_DIR}/saved.mp3`);
    });

    it("should throw error when text is empty", async () => {
      expect(speakTool.execute({ text: "" }, agent)).rejects.toThrow("text is required");
    });

    it("should call infoMessage when converting to speech", async () => {
      const infoSpy = spyOn(agent, "infoMessage");

      await speakTool.execute({ text: "Hello world" }, agent);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("[voice_speak]"));
    });

    it("should use custom speed when provided", async () => {
      await speakTool.execute({ text: "Hello", speed: 1.5 }, agent);

      expect(mockSpeechModel.generateSpeech).toHaveBeenCalledWith(expect.objectContaining({ speed: 1.5 }), agent);
    });
  });
});
