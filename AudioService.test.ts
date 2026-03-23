import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import createTestingAgent from "@tokenring-ai/agent/test/createTestingAgent";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp";
import {TranscriptionModelRegistry, SpeechModelRegistry} from "@tokenring-ai/ai-client/ModelRegistry";
import AudioService from './AudioService.js';
import {AudioServiceConfigSchema} from './schema.js';
import {AudioState} from './state/audioState.js';

describe('AudioService', () => {
  let app: ReturnType<typeof createTestingApp>;
  let audioService: AudioService;
  let mockAgent: ReturnType<typeof createTestingAgent>;
  let mockTranscriptionModel: any;
  let mockSpeechModel: any;

  beforeEach(() => {
    app = createTestingApp();
    
    // Create config with required fields
    const config = AudioServiceConfigSchema.parse({
      tmpDirectory: '/tmp',
      providers: {},
      agentDefaults: {
        provider: 'test-provider',
        transcribe: {
          model: 'whisper-1',
          prompt: 'Convert to English',
          language: 'en'
        },
        speech: {
          model: 'OpenAI:tts-1',
          voice: 'alloy',
          speed: 1.0
        }
      }
    });
    
    audioService = new AudioService(config);
    
    // Mock transcription model
    mockTranscriptionModel = {
      transcribe: vi.fn().mockResolvedValue(['Hello world'])
    };
    
    // Mock speech model
    mockSpeechModel = {
      generateSpeech: vi.fn().mockResolvedValue([Buffer.from('test audio data')])
    };
    
    // Create proper mock registries that can be found by type
    const mockTranscriptionRegistry = new TranscriptionModelRegistry(app);
    const mockSpeechRegistry = new SpeechModelRegistry(app);
    
    // Mock the getClient methods
    vi.spyOn(mockTranscriptionRegistry, 'getClient').mockResolvedValue(mockTranscriptionModel);
    vi.spyOn(mockSpeechRegistry, 'getClient').mockResolvedValue(mockSpeechModel);
    
    app.addServices(mockTranscriptionRegistry);
    app.addServices(mockSpeechRegistry);
    
    mockAgent = createTestingAgent(app);
    audioService.attach(mockAgent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    app.shutdown();
  });

  it('should have correct name and description', () => {
    expect(audioService.name).toBe('AudioService');
    expect(audioService.description).toBe('Service for Audio Operations');
  });

  it('should register and retrieve providers', () => {
    const mockProvider = {
      record: vi.fn(),
      playback: vi.fn()
    };
    
    audioService.registerProvider('test-provider', mockProvider);
    
    const providers = audioService.getAvailableProviders();
    expect(providers).toContain('test-provider');
    
    const retrieved = audioService.providerRegistry.getItemByName('test-provider');
    expect(retrieved).toBe(mockProvider);
  });

  it('should set active provider in agent state', () => {
    const mockProvider = {
      record: vi.fn(),
      playback: vi.fn()
    };
    
    audioService.registerProvider('new-provider', mockProvider);
    audioService.setActiveProvider('new-provider', mockAgent);
    
    expect(mockAgent.getState(AudioState).activeProvider).toBe('new-provider');
  });

  it('should require audio provider from agent state', () => {
    const mockProvider = {
      record: vi.fn(),
      playback: vi.fn()
    };
    
    audioService.registerProvider('test-provider', mockProvider);
    audioService.setActiveProvider('test-provider', mockAgent);
    
    const provider = audioService.requireAudioProvider(mockAgent);
    expect(provider).toBe(mockProvider);
  });

  it('should throw error when no provider is set', () => {
    // Create agent without setting provider
    const agentWithoutProvider = createTestingAgent(app);
    audioService.attach(agentWithoutProvider);
    
    expect(() => audioService.requireAudioProvider(agentWithoutProvider))
      .toThrow();
  });

  it('should attach and initialize agent state', () => {
    const newAgent = createTestingAgent(app);
    audioService.attach(newAgent);
    
    const state = newAgent.getState(AudioState);
    expect(state).toBeDefined();
    expect(state.activeProvider).toBe('test-provider');
    expect(state.transcribe.model).toBe('whisper-1');
    expect(state.speech.model).toBe('OpenAI:tts-1');
  });

  it('should convert audio to text', async () => {
    const mockProvider = {
      record: vi.fn(),
      playback: vi.fn()
    };
    
    audioService.registerProvider('test-provider', mockProvider);
    audioService.setActiveProvider('test-provider', mockAgent);
    
    // Pass a Buffer instead of a file path
    const audioBuffer = Buffer.from('fake audio data');
    const result = await audioService.convertAudioToText(audioBuffer, { language: 'en' }, mockAgent);
    
    expect(result.text).toBe('Hello world');
    expect(mockTranscriptionModel.transcribe).toHaveBeenCalled();
  });

  it('should convert text to speech', async () => {
    const mockProvider = {
      record: vi.fn(),
      playback: vi.fn()
    };
    
    audioService.registerProvider('test-provider', mockProvider);
    audioService.setActiveProvider('test-provider', mockAgent);
    
    const result = await audioService.convertTextToSpeech('Hello world', { speed: 1.2 }, mockAgent);
    
    expect(result.data).toBeInstanceOf(Buffer);
    expect(mockSpeechModel.generateSpeech).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Hello world',
        speed: 1.2
      }),
      mockAgent
    );
  });

  it('should use default language when not provided', async () => {
    const mockProvider = {
      record: vi.fn(),
      playback: vi.fn()
    };
    
    audioService.registerProvider('test-provider', mockProvider);
    audioService.setActiveProvider('test-provider', mockAgent);
    
    // Pass a Buffer instead of a file path
    const audioBuffer = Buffer.from('fake audio data');
    await audioService.convertAudioToText(audioBuffer, {}, mockAgent);
    
    expect(mockTranscriptionModel.transcribe).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'en' // Default from config
      }),
      mockAgent
    );
  });
});
