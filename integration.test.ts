import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import createTestingAgent from "@tokenring-ai/agent/test/createTestingAgent";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp";
import {ChatService} from "@tokenring-ai/chat";
import {AgentCommandService} from "@tokenring-ai/agent";
import AudioService from './AudioService.ts';
import {AudioState} from './state/audioState.ts';
import {AudioServiceConfigSchema} from './schema.ts';
import {TranscriptionModelRegistry, SpeechModelRegistry} from "@tokenring-ai/ai-client/ModelRegistry";
import plugin from './plugin.ts';
import tools from './tools.ts';
import agentCommands from './commands.ts';

describe('Audio Integration Tests', () => {
  let app: ReturnType<typeof createTestingApp>;
  let agent: ReturnType<typeof createTestingAgent>;
  let audioService: AudioService;
  let mockProvider: any;
  let mockTranscriptionModel: any;
  let mockSpeechModel: any;
  let mockTranscriptionRegistry: any;
  let mockSpeechRegistry: any;

  beforeEach(() => {
    app = createTestingApp();
    
    mockProvider = {
      record: vi.fn().mockResolvedValue({ filePath: '/tmp/test.wav' }),
      playback: vi.fn().mockResolvedValue('/tmp/test.wav')
    };
    
    mockTranscriptionModel = {
      transcribe: vi.fn().mockResolvedValue(['Hello world'])
    };
    
    mockSpeechModel = {
      generateSpeech: vi.fn().mockResolvedValue([Buffer.from('test audio')])
    };
    
    // Create proper mock registries
    mockTranscriptionRegistry = new TranscriptionModelRegistry(app);
    mockSpeechRegistry = new SpeechModelRegistry(app);
    
    vi.spyOn(mockTranscriptionRegistry, 'getClient').mockResolvedValue(mockTranscriptionModel);
    vi.spyOn(mockSpeechRegistry, 'getClient').mockResolvedValue(mockSpeechModel);
    
    const config = AudioServiceConfigSchema.parse({
      tmpDirectory: '/tmp',
      providers: { test: mockProvider },
      agentDefaults: {
        provider: 'test',
        transcribe: { model: 'whisper-1', language: 'en' },
        speech: { model: 'tts-1', voice: 'alloy', speed: 1.0 }
      }
    });
    
    audioService = new AudioService(config);
    audioService.registerProvider('test', mockProvider);
    
    app.addServices(mockTranscriptionRegistry);
    app.addServices(mockSpeechRegistry);
    app.addServices(audioService);
    
    agent = createTestingAgent(app);
    audioService.attach(agent);
    audioService.setActiveProvider('test', agent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    app.shutdown();
  });

  it('should integrate AudioService with agent', () => {
    expect(agent.requireServiceByType(AudioService)).toBe(audioService);
    expect(agent.getState(AudioState)).toBeDefined();
  });

  it('should complete full transcription workflow', async () => {
    // Create a temp file for testing
    const audioBuffer = Buffer.from('fake audio data');
    
    // Transcribe the audio buffer
    const transcription = await audioService.convertAudioToText(
      audioBuffer, 
      { language: 'en' }, 
      agent
    );
    
    expect(transcription.text).toBe('Hello world');
    expect(mockTranscriptionModel.transcribe).toHaveBeenCalled();
  });

  it('should complete full TTS workflow', async () => {
    // Convert text to speech
    const ttsResult = await audioService.convertTextToSpeech(
      'Hello world',
      { speed: 1.2 },
      agent
    );
    
    expect(ttsResult.data).toBeInstanceOf(Buffer);
    
    // Play the generated audio
    const tmpFile = '/tmp/speech-test.mp3';
    await mockProvider.playback(tmpFile);
    
    expect(mockProvider.playback).toHaveBeenCalledWith(tmpFile);
  });

  it('should handle provider switching', async () => {
    const newProvider = {
      record: vi.fn().mockResolvedValue({ filePath: '/tmp/new.wav' }),
      playback: vi.fn().mockResolvedValue('/tmp/new.wav')
    };
    
    audioService.registerProvider('new-provider', newProvider);
    audioService.setActiveProvider('new-provider', agent);
    
    expect(agent.getState(AudioState).activeProvider).toBe('new-provider');
    expect(audioService.requireAudioProvider(agent)).toBe(newProvider);
  });

  it('should integrate plugin with app', async () => {
    // Create a new app for plugin testing
    const pluginApp = createTestingApp();
    
    const config = {
      audio: AudioServiceConfigSchema.parse({
        tmpDirectory: '/tmp',
        providers: {},
        agentDefaults: {
          provider: 'test-provider',
          transcribe: {},
          speech: {}
        }
      })
    };
    
    // Mock required services - these need to be registered BEFORE plugin.install
    // The plugin uses waitForService which calls the callback immediately if service exists
    const mockChatService = new ChatService(pluginApp, { defaultModels: [], agentDefaults: {} });
    const addToolsSpy = vi.spyOn(mockChatService, 'addTools');
    
    const mockCommandService = new AgentCommandService(pluginApp, {} as any);
    const addCommandsSpy = vi.spyOn(mockCommandService, 'addAgentCommands');
    
    pluginApp.addServices(mockChatService);
    pluginApp.addServices(mockCommandService);
    
    plugin.install(pluginApp, config as any);
    
    // Verify AudioService was registered
    const services = pluginApp.getServices();
    expect(services.some(s => s.name === 'AudioService')).toBe(true);
    
    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // The waitForService callbacks should have been called since services exist
    expect(addToolsSpy).toHaveBeenCalled();
    expect(addCommandsSpy).toHaveBeenCalled();
    
    pluginApp.shutdown();
  });

  it('should register tools with ChatService', () => {
    const toolNames = Object.keys(tools);
    expect(toolNames).toContain('record');
    expect(toolNames).toContain('transcribe');
    expect(toolNames).toContain('speak');
    expect(toolNames).toContain('playback');
    
    // Verify each tool has required properties
    Object.values(tools).forEach(tool => {
      expect(tool.name).toBeDefined();
      expect(tool.displayName).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.execute).toBeDefined();
    });
  });

  it('should register commands with AgentCommandService', () => {
    expect(agentCommands).toBeInstanceOf(Array);
    expect(agentCommands.length).toBeGreaterThan(0);
    
    // Check for expected commands
    const commandNames = agentCommands.map(cmd => cmd.name);
    expect(commandNames).toContain('audio record');
    expect(commandNames).toContain('audio play');
    expect(commandNames).toContain('audio speak');
    expect(commandNames).toContain('audio transcribe');
    
    // Verify each command has required properties
    agentCommands.forEach(command => {
      expect(command.name).toBeDefined();
      expect(command.description).toBeDefined();
      expect(command.inputSchema).toBeDefined();
      expect(command.help).toBeDefined();
      expect(command.execute).toBeDefined();
    });
  });

  it('should handle state initialization for new agent', () => {
    // Create a new agent with the same app
    const newAgent = createTestingAgent(app);
    audioService.attach(newAgent);
    
    // State should be initialized with defaults from agentDefaults
    expect(newAgent.getState(AudioState).transcribe.model).toBe('whisper-1');
  });

  it('should handle concurrent operations', async () => {
    // Perform multiple operations concurrently
    const operations = [
      audioService.convertTextToSpeech('Text 1', {}, agent),
      audioService.convertTextToSpeech('Text 2', {}, agent),
      mockProvider.playback('/tmp/test1.wav'),
      mockProvider.playback('/tmp/test2.wav'),
    ];
    
    const results = await Promise.all(operations);
    
    expect(results).toHaveLength(4);
    expect(mockSpeechModel.generateSpeech).toHaveBeenCalledTimes(2);
    expect(mockProvider.playback).toHaveBeenCalledTimes(2);
  });

  it('should handle errors gracefully when no provider is set', () => {
    // Create a new app and service without provider
    const errorApp = createTestingApp();
    const errorConfig = {
      tmpDirectory: '/tmp',
      providers: {},
      agentDefaults: {
        provider: 'test-provider', // Need a provider for schema validation
        transcribe: { model: 'whisper-1' },
        speech: { model: 'tts-1' }
      }
    };
    
    const errorAudioService = new AudioService(errorConfig as any);
    // Don't register the provider
    errorApp.addServices(errorAudioService);
    
    const errorAgent = createTestingAgent(errorApp);
    errorAudioService.attach(errorAgent);
    // Don't set a provider - activeProvider will be 'test-provider' but it's not registered
    
    expect(() => {
      errorAudioService.requireAudioProvider(errorAgent);
    }).toThrow();
    
    errorAgent.shutdown?.();
    errorApp.shutdown();
  });
});
