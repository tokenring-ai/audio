# @tokenring-ai/audio

## Overview

Voice recording, playback, and speech processing for the TokenRing AI ecosystem. This package provides audio operations through integration with the AI client services for transcription and speech generation. It supports type-safe configuration with Zod schemas and integrates with the TokenRing agent framework.

## Features

- **Type-Safe Configuration**: Zod-based validation for all configuration options
- **Audio Transcription**: Convert audio to text using transcription model registry
- **Text-to-Speech**: Generate speech from text using speech model registry
- **Agent State Management**: Audio state is persisted across agent sessions
- **Plugin Architecture**: Automatic registration with TokenRing applications
- **Interactive Model Management**: Select TTS and STT models from available providers
- **Command System**: Rich chat command interface for audio operations

## Installation

```bash
bun install @tokenring-ai/audio
```

## Core Components

### AudioService

The main service class that manages audio operations and provider registry.

```typescript
import AudioService from '@tokenring-ai/audio/AudioService';

const audioService = new AudioService({
  tmpDirectory: '/tmp',
  providers: {},
  agentDefaults: {
    provider: 'linux',
    transcribe: {
      model: 'whisper-1',
      prompt: 'Convert the audio to english',
      language: 'en',
    },
    speech: {
      model: 'OpenAI:tts-1',
      voice: 'alloy',
      speed: 1.0,
    },
  },
});
```

#### Methods

| Method | Description |
|--------|-------------|
| `attach(agent: Agent)` | Initialize audio state for an agent with default configuration |
| `registerProvider(name: string, provider: AudioProvider)` | Register an audio provider |
| `getAvailableProviders(): string[]` | Get list of registered providers |
| `requireAudioProvider(agent: Agent): AudioProvider` | Get the active audio provider for an agent |
| `setActiveProvider(name: string, agent: Agent)` | Set the active audio provider for an agent |
| `convertAudioToText(audioFile, { language }, agent)` | Transcribe audio to text |
| `convertTextToSpeech(text, { voice, speed }, agent)` | Convert text to speech |

### AudioProvider

Abstract interface for implementing audio providers.

```typescript
interface AudioProvider {
  record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult>;
  playback(filename: string): Promise<string>;
}

interface RecordingOptions {
  sampleRate?: number;
  channels?: number;
  format?: string;
  timeout?: number;
}

interface RecordingResult {
  filePath: string;
}

interface AudioResult {
  data: any;
}
```

## Chat Commands

### `/audio` Command

Interactive commands for managing audio operations:

```bash
# Record audio from microphone
/audio record [options]

# Play audio file
/audio play <file>

# Convert text to speech
/audio speak <text> [options]

# Transcribe audio file
/audio transcribe <file> [options]

# Manage TTS/STT models
/audio model {tts|stt} {default|get|set|reset|select}
```

### Command Details

| Command | Description |
|---------|-------------|
| `/audio record [options]` | Record audio from microphone (Ctrl+C to stop) |
| `/audio play <file>` | Play audio file through speakers |
| `/audio speak <text> [options]` | Convert text to speech |
| `/audio transcribe <file> [options]` | Transcribe audio file to text |
| `/audio model tts ...` | Manage TTS (text-to-speech) models |
| `/audio model stt ...` | Manage STT (speech-to-text) models |

### Model Management Commands

#### TTS Model Management

| Command | Description |
|---------|-------------|
| `/audio model tts` | Show current TTS model and open interactive selector |
| `/audio model tts get` | Show current TTS model |
| `/audio model tts set <model>` | Set TTS model |
| `/audio model tts select` | Interactive model selection |
| `/audio model tts reset` | Reset to initial configured model |

#### STT Model Management

| Command | Description |
|---------|-------------|
| `/audio model stt` | Show current STT model and open interactive selector |
| `/audio model stt get` | Show current STT model |
| `/audio model stt set <model>` | Set STT model |
| `/audio model stt select` | Interactive model selection |
| `/audio model stt reset` | Reset to initial configured model |

### Interactive Mode

- Models are grouped by provider (OpenAI, Anthropic, etc.)
- Status indicators show availability:
  - ✅ Online - Ready for immediate use
  - 🧊 Cold - May have startup delay
  - 🔴 Offline - Currently unavailable

## Tools

The package provides the following tools for agent interactions:

### voice_record

Record audio using the active voice provider.

```typescript
{
  name: "voice_record",
  displayName: "Audio/record",
  description: "Record audio using the active voice provider",
  inputSchema: z.object({
    sampleRate: z.number().optional().describe("Sample rate for recording"),
    channels: z.number().optional().describe("Number of audio channels"),
    format: z.string().optional().describe("Audio format"),
    timeout: z.number().optional().describe("Recording timeout in milliseconds"),
  })
}
```

**Returns:** `{ type: 'json', data: { filePath: string } }`

### voice_transcribe

Transcribe audio file to text.

```typescript
{
  name: "voice_transcribe",
  displayName: "Audio/transcribe",
  description: "Transcribe audio using the active voice provider",
  inputSchema: z.object({
    audioFile: z.any().describe("Audio file to transcribe"),
    language: z.string().describe("Language to transcribe the audio to"),
  })
}
```

**Returns:** `string` - The transcription text

### voice_speak

Convert text to speech and play it.

```typescript
{
  name: "voice_speak",
  displayName: "Audio/speak",
  description: "Convert text to speech using the active voice provider",
  inputSchema: z.object({
    text: z.string().min(1).describe("Text to convert to speech"),
    speed: z.number().optional().describe("Speech speed"),
  })
}
```

**Returns:** `string` - "Playback succeeded"

### audio_playback

Play audio file.

```typescript
{
  name: "audio_playback",
  displayName: "Audio/playback",
  description: "Play audio file using the active voice provider",
  inputSchema: z.object({
    filename: z.string().min(1).describe("Audio filename to play"),
  })
}
```

**Returns:** `{ type: 'json', data: { filePath: string } }`

## Configuration

### Plugin Configuration

```typescript
import audioPlugin from '@tokenring-ai/audio';

const app = new TokenRingApp({
  plugins: [
    audioPlugin.withConfig({
      audio: {
        tmpDirectory: '/tmp',
        providers: {
          linux: { /* provider config */ }
        },
        agentDefaults: {
          provider: 'linux',
          transcribe: {
            model: 'whisper-1',
            prompt: 'Convert the audio to english',
            language: 'en',
          },
          speech: {
            model: 'OpenAI:tts-1',
            voice: 'alloy',
            speed: 1.0,
          },
        },
      },
    }),
  ],
});
```

### Configuration Schema

```typescript
// Plugin-level configuration
const packageConfigSchema = z.object({
  audio: AudioServiceConfigSchema.optional(),
})

// Service configuration
const AudioServiceConfigSchema = z.object({
  tmpDirectory: z.string().default('/tmp'),
  providers: z.record(z.string(), z.any()),
  agentDefaults: AudioAgentDefaultsSchema,
});

// Agent defaults configuration
const AudioAgentDefaultsSchema = z.object({
  provider: z.string(),
  transcribe: AudioTranscriptionConfigSchema.prefault({}),
  speech: AudioSpeechConfigSchema.prefault({}),
});

// Transcription configuration
const AudioTranscriptionConfigSchema = z.object({
  model: z.string().default('whisper-1'),
  prompt: z.string().default('Convert the audio to english'),
  language: z.string().default('en'),
});

// Speech configuration
const AudioSpeechConfigSchema = z.object({
  model: z.string().default('OpenAI:tts-1'),
  voice: z.string().default('alloy'),
  speed: z.number().default(1.0),
});

// Agent configuration slice
const AudioAgentConfigSchema = z.object({
  provider: z.string().optional(),
  transcribe: AudioTranscriptionConfigSchema.optional(),
  speech: AudioSpeechConfigSchema.optional()
}).prefault({});
```

## State Management

### AudioState

The `AudioState` class manages audio configuration persistence across agent sessions:

```typescript
class AudioState implements AgentStateSlice<typeof serializationSchema> {
  readonly name = "AudioState";
  serializationSchema = serializationSchema;
  
  activeProvider: string | null;
  transcribe: z.output<typeof AudioTranscriptionConfigSchema>;
  speech: z.output<typeof AudioSpeechConfigSchema>;
  
  constructor(initialConfig: AudioAgentDefaultsSchema);
  transferStateFromParent(parent: Agent): void;
  serialize(): SerializationSchema;
  deserialize(data: SerializationSchema): void;
  show(): string[];
}
```

**State Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `activeProvider` | `string \| null` | Currently active audio provider |
| `transcribe` | `AudioTranscriptionConfigSchema` | Transcription configuration |
| `speech` | `AudioSpeechConfigSchema` | Speech configuration |

**State Methods:**

| Method | Description |
|--------|-------------|
| `transferStateFromParent(parent: Agent)` | Inherit state from parent agent |
| `serialize()` | Convert state to JSON |
| `deserialize(data)` | Restore state from JSON |
| `show()` | Generate displayable state summary |

**State Display Format:**

The `show()` method returns an array of strings for UI display:
- `Active Provider: <provider_name>`
- `Transcription Model: <model_name>`
- `Transcription Prompt: <prompt>`
- `Transcription Language: <language>`
- `Speech Model: <model_name>`
- `Speech Voice: <voice>`
- `Speech Speed: <speed>`

## Integration

### TokenRing Plugin Integration

```typescript
import audioPlugin from '@tokenring-ai/audio';

app.registerPlugin(audioPlugin);
```

### Agent Integration

```typescript
// Service automatically available through agent
const audioService = agent.requireServiceByType(AudioService);

// Transcribe audio
const result = await audioService.convertAudioToText(audioFile, {
  language: 'en',
}, agent);

// Generate speech
const speech = await audioService.convertTextToSpeech('Hello world', {
  voice: 'alloy',
  speed: 1.2,
}, agent);

// Set active provider
audioService.setActiveProvider('linux', agent);
```

### Provider Integration

```typescript
const audioService = agent.requireServiceByType(AudioService);

// Register a custom provider
audioService.registerProvider('custom', {
  async record(signal, options) {
    // Custom recording implementation
    return { filePath: '/path/to/recording.wav' };
  },
  async playback(filename) {
    // Custom playback implementation
    return filename;
  },
});

// Use the provider
audioService.setActiveProvider('custom', agent);
```

## Development

### Testing

```bash
bun run test
bun run test:watch
bun run test:coverage
```

### Package Structure

```
pkg/audio/
├── index.ts                 # Main exports
├── AudioService.ts          # Main audio service implementation
├── AudioProvider.ts         # Audio provider interfaces
├── schema.ts                # Zod configuration schemas
├── plugin.ts                # TokenRing plugin for service registration
├── state/
│   └── audioState.ts        # Audio state management
├── tools.ts                 # Tool registry
├── tools/
│   ├── record.ts            # Voice recording tool
│   ├── transcribe.ts        # Audio transcription tool
│   ├── speak.ts             # Text-to-speech tool
│   └── playback.ts          # Audio playback tool
├── chatCommands.ts          # Chat command registry
├── commands/
│   └── audio.ts             # /audio command implementation
│   └── audio/
│       ├── record.ts        # /audio record command
│       ├── play.ts          # /audio play command
│       ├── speak.ts         # /audio speak command
│       ├── transcribe.ts    # /audio transcribe command
│       └── model.ts         # /audio model command
│       └── model/
│           ├── tts.ts       # TTS model management router
│           └── stt.ts       # STT model management router
│           └── tts/         # TTS: default, get, set, reset, select
│           └── stt/         # STT: default, get, set, reset, select
├── package.json             # Package manifest
└── README.md                # This file
```

### Contribution Guidelines

- Follow established coding patterns
- Add unit tests for new functionality
- Update documentation for new features
- Ensure all changes work with TokenRing agent framework
- Test with both headless and interactive modes

## License

MIT License - see [LICENSE](./LICENSE) file for details.
