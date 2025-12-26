# @tokenring-ai/audio

Voice recording, playback, and speech processing for the TokenRing ecosystem

## Overview

The `@tokenring-ai/audio` package provides a comprehensive audio framework for the Token Ring AI ecosystem. It offers unified interfaces for voice recording, audio transcription, text-to-speech synthesis, and audio playback operations. This package serves as the foundation for platform-specific audio implementations and integrates seamlessly with the TokenRing agent and chat systems.

## Features

- **Voice Recording**: Record audio from microphone with configurable options
- **Audio Transcription**: Convert audio files to text using AI models
- **Text-to-Speech**: Convert text to natural-sounding speech with various voice options
- **Audio Playback**: Play audio files with customizable settings
- **Provider Architecture**: Support for multiple audio provider implementations
- **Chat Integration**: Built-in chat commands and tools for agent interactions
- **Type Safety**: Full TypeScript support with Zod validation
- **Service Integration**: Seamless integration with TokenRing service architecture
- **Plugin System**: Automatic service and tool registration via TokenRing plugin

## Installation

```bash
bun install @tokenring-ai/audio
```

## Dependencies

- `@tokenring-ai/agent` ^0.2.0 - Agent command system integration
- `@tokenring-ai/app` ^0.2.0 - Application framework and service management
- `@tokenring-ai/chat` ^0.2.0 - Chat service integration
- `@tokenring-ai/ai-client` ^0.2.0 - AI client for transcription
- `@tokenring-ai/utility` ^0.2.0 - Utility functions and registry system
- `zod` ^4.1.12 - Schema validation

## Configuration

The package supports configuration through the TokenRing app configuration system:

```typescript
// Example configuration
const audioConfig = {
  defaultProvider: "openai", // Default audio provider
  providers: {
    openai: {
      apiKey: "your-api-key",
      // provider-specific options
    }
  }
};
```

## Core API

### AudioService

The main service class that manages audio operations and provider registry:

```typescript
import { AudioService } from '@tokenring-ai/audio';

// Initialize audio service (typically via TokenRing plugin)
const audioService = agent.requireServiceByType(AudioService);

// Get available providers
const providers = audioService.getAvailableProviders();

// Set active provider
audioService.setActiveProvider('openai');

// Record audio
const recording = await audioService.record(abortSignal, {
  sampleRate: 44100,
  channels: 2,
  format: 'wav'
});

// Transcribe audio
const transcription = await audioService.transcribe(audioFile, {
  model: 'whisper-1',
  language: 'en'
});

// Convert text to speech
const speech = await audioService.speak('Hello world', {
  voice: 'alloy',
  speed: 1.0,
  format: 'mp3'
});

// Play audio file
await audioService.playback('recording.wav', {
  sampleRate: 44100,
  channels: 2
});
```

### AudioProvider

Abstract base class for implementing custom audio providers:

```typescript
import AudioProvider from '@tokenring-ai/audio';

export default class MyAudioProvider extends AudioProvider {
  async record(abortSignal: AbortSignal, options?: RecordingOptions): Promise<RecordingResult> {
    // Implementation for recording
  }

  async transcribe(audioFile: any, options?: TranscriptionOptions): Promise<TranscriptionResult> {
    // Implementation for transcription
  }

  async speak(text: string, options?: TextToSpeechOptions): Promise<AudioResult> {
    // Implementation for text-to-speech
  }

  async playback(filename: string, options?: PlaybackOptions): Promise<string> {
    // Implementation for playback
  }
}
```

## Chat Commands

The package provides a `/voice` command for interactive audio operations:

```bash
# Record audio
/voice record

# Transcribe audio file
/voice transcribe recording.wav

# Convert text to speech
/voice speak "Hello world"

# Play audio file
/voice playback output.mp3

# Manage providers
/voice provider openai
/voice provider
```

### Voice Command Options

- `--model <name>` - Specify model for transcription/TTS
- `--voice <id>` - Voice ID for text-to-speech
- `--speed <n>` - Speech speed multiplier
- `--format <fmt>` - Audio format (wav, mp3, etc.)
- `--language <code>` - Language code for transcription

## Tools

The package provides tools for agent integration:

### voice/record
Record audio from microphone.

```typescript
{
  name: "voice/record",
  description: "Record audio using the active voice provider",
  inputSchema: {
    sampleRate: number,     // Sample rate for recording
    channels: number,       // Number of audio channels
    format: string,         // Audio format
    timeout: number         // Recording timeout in milliseconds
  }
}
```

### voice/transcribe
Transcribe audio file to text.

```typescript
{
  name: "voice/transcribe",
  description: "Transcribe audio using the active voice provider",
  inputSchema: {
    audioFile: any,         // Audio file to transcribe
    model: string,          // Transcription model
    language: string,       // Language code
    timestampGranularity: string // Timestamp granularity
  }
}
```

### voice/speak
Convert text to speech.

```typescript
{
  name: "voice/speak",
  description: "Convert text to speech using the active voice provider",
  inputSchema: {
    text: string,           // Text to convert to speech
    model: string,          // TTS model
    voice: string,          // Voice ID
    speed: number,          // Speech speed
    format: string          // Audio format
  }
}
```

### voice/playback
Play audio file.

```typescript
{
  name: "voice/playback",
  description: "Play audio file using the active voice provider",
  inputSchema: {
    filename: string,       // Audio filename to play
    sampleRate: number,     // Sample rate for playback
    channels: number        // Number of audio channels
  }
}
```

## Integration with TokenRing

### Plugin Registration

The package exports a TokenRing plugin for automatic integration:

```typescript
import audioPlugin from '@tokenring-ai/audio';

// Register with TokenRing app
app.registerPlugin(audioPlugin);
```

### Service Dependencies

- Requires `ChatService` for tool integration
- Requires `AgentCommandService` for chat command integration
- Provides `AudioService` for audio operations
- Uses `TokenRingApp` configuration system

## Type Definitions

### RecordingOptions
```typescript
interface RecordingOptions {
  sampleRate?: number;     // Audio sample rate
  channels?: number;       // Number of audio channels
  format?: string;         // Audio format (wav, mp3, etc.)
  timeout?: number;        // Recording timeout in milliseconds
}
```

### TranscriptionOptions
```typescript
interface TranscriptionOptions {
  model?: string;          // Transcription model
  prompt?: string;         // Optional prompt for better transcription
  language?: string;       // Language code
  timestampGranularity?: string; // Timestamp granularity
  timeout?: number;        // Operation timeout
}
```

### TextToSpeechOptions
```typescript
interface TextToSpeechOptions {
  model?: string;          // TTS model
  voice?: string;          // Voice ID
  speed?: number;          // Speech speed multiplier
  format?: string;         // Audio format
  timeout?: number;        // Operation timeout
}
```

### PlaybackOptions
```typescript
interface PlaybackOptions {
  sampleRate?: number;     // Sample rate for playback
  channels?: number;       // Number of audio channels
  timeout?: number;        // Playback timeout
}
```

### RecordingResult
```typescript
interface RecordingResult {
  filePath: string;        // Path to recorded audio file
}
```

### AudioResult
```typescript
interface AudioResult {
  data: any;               // Audio data (format depends on provider)
}
```

## Examples

### Basic Usage

```typescript
import { AudioService } from '@tokenring-ai/audio';

// Initialize audio service (via TokenRing plugin)
const audioService = agent.requireServiceByType(AudioService);

// Record audio
const recording = await audioService.record(new AbortController().signal);
console.log('Recording saved:', recording.filePath);

// Transcribe the recording
const transcription = await audioService.transcribe(recording.filePath);
console.log('Transcription:', transcription.text);

// Generate speech from text
const speech = await audioService.speak('Hello, this is a test.');
console.log('Speech generated:', speech.data);
```

### Chat Integration

```typescript
// Use voice commands in chat
/voice record --format wav --timeout 30000
/voice transcribe recording.wav --language en
/voice speak "Hello, how are you?" --voice alloy --speed 1.2
/voice playback greeting.mp3
```

### Provider Management

```typescript
// List available providers
/voice provider

// Switch to a different provider
/voice provider openai
/voice provider azure
```

## Package Structure

```
pkg/audio/
├── index.ts                 # Main exports and configuration schema
├── AudioService.ts          # Main audio service implementation
├── AudioProvider.ts         # Abstract base class for providers
├── tools.ts                 # Tool registry
├── tools/
│   ├── record.ts           # Voice recording tool
│   ├── transcribe.ts       # Audio transcription tool
│   ├── speak.ts            # Text-to-speech tool
│   └── playback.ts         # Audio playback tool
├── chatCommands.ts          # Chat command registry
├── commands/
│   └── voice.ts            # Voice command implementation
├── plugin.ts               # TokenRing plugin for service registration
└── package.json            # Package manifest
```

## Related Packages

- `@tokenring-ai/linux-audio` - Linux-specific audio provider implementation
- `@tokenring-ai/agent` - Agent command system
- `@tokenring-ai/chat` - Chat service integration
- `@tokenring-ai/app` - Application framework

## License

MIT License - see LICENSE file for details