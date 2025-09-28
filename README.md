# Audio Package Documentation

## Overview

The `@tokenring-ai/audio` package provides an abstract audio framework for the Token Ring AI ecosystem. It defines the core AudioProvider interface and AudioService for managing audio operations including recording, playback, transcription, and text-to-speech synthesis. This package serves as the foundation for platform-specific audio implementations.

## Core Components

### AudioProvider (Abstract Class)
Base class that defines the interface for audio operations:
- `record(abortSignal, options?)` - Record audio from microphone
- `transcribe(audioFile, options?)` - Convert audio to text
- `speak(text, options?)` - Convert text to speech
- `playback(filename, options?)` - Play audio files

### AudioService
Service class that manages multiple AudioProvider implementations:
- Provider registry with single selection
- Unified interface for all audio operations
- Provider switching capabilities

### Chat Commands
- `/voice` - Voice operations command with subcommands for record, transcribe, speak, playback, and provider management

### Tools
- `record` - Recording tool for agents
- `transcribe` - Transcription tool for agents  
- `speak` - Text-to-speech tool for agents
- `playback` - Audio playback tool for agents

## Usage

```typescript
import { AudioService, AudioProvider } from '@tokenring-ai/audio';

// Register a provider implementation
const audioService = new AudioService();
audioService.registerProvider('myProvider', new MyAudioProvider());
audioService.setActiveProvider('myProvider');

// Use audio operations
const recording = await audioService.record(abortSignal);
const transcription = await audioService.transcribe(audioFile);
```

## Implementation

To create a new audio provider, extend the AudioProvider class and implement all abstract methods. See `@tokenring-ai/linux-audio` for a complete implementation example.