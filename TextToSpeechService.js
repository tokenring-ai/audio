import {experimental_generateSpeech} from 'ai';
import {openai} from '@ai-sdk/openai';
import fs from 'fs/promises';
import path from 'path';

import { Service } from "@token-ring/registry";
import { AbortSignal } from "node:abort-controller";
import { ReadableStream } from "node:streams";
import { Buffer } from "node:buffer";
export default class TextToSpeechService extends Service {
 name = "TextToSpeechService";
 description = "Provides TextToSpeech functionality";
 static constructorProperties = {
  model: {
   type: "string",
   required: false,
   description: "The text-to-speech model to use. Defaults to 'tts-1'"
  },
  voice: {
   type: "string",
   required: false,
   description: "Voice ID to use for speech generation (e.g., 'alloy', 'echo', 'fable', 'onyx')"
  },
  speed: {
   type: "number",
   required: false,
   description: "Speed of speech generation. Default is 1.0, range typically 0.25-4.0"
  },
  format: {
   type: "string",
   required: false,
   description: "Audio format for output (e.g., 'mp3', 'opus'). Provider-specific."
  },
  timeout: {
   type: "number",
   required: false,
   description: "Timeout in milliseconds for text-to-speech request"
  },
  outputDirectory: {
   type: "string",
   required: false,
   description: "Directory to save generated audio files"
  }
 };

 constructor({
              model = 'tts-1',
              voice = 'alloy',
              speed = 1.0,
              format = 'mp3',
              timeout,
              outputDirectory = './audio-output'
             } = {}) {
  super();
  this.model = model;
  this.voice = voice;
  this.speed = speed;
  this.format = format;
  this.timeout = timeout;
  this.outputDirectory = outputDirectory;
  this.audioData = null;
 }

 /**
  * Converts text to speech and returns audio data
  * @param text The text to convert to speech
  * @returns The audio data as a ReadableStream
  * @throws {Error} When no text is provided
  */
 async speak(text) {
  if (!text) {
   throw new Error('No text provided for speech synthesis.');
  }

  const options = {
   model: openai.speech(this.model),
   voice: this.voice,
   text,
   speed: this.speed
  };

  // Add format option if specified
  if (this.format) {
   options.providerOptions = {
    openai: {
     responseFormat: this.format
    }
   };
  }

  // Add timeout if specified
  if (this.timeout) {
   options.abortSignal = AbortSignal.timeout(this.timeout);
  }

  this.audioData = await experimental_generateSpeech(options);
  return this.audioData;
 }

 /**
  * Saves the generated audio data to a file
  * @param filename Optional custom filename (will generate one if not provided)
  * @returns The full path to the saved audio file
  * @throws {Error} When no audio data is available or file cannot be saved
  */
 async saveToFile(filename) {
  if (!this.audioData) {
   throw new Error('No audio data available. Call speak() method first.');
  }

// Ensure output directory exists
  await fs.mkdir(this.outputDirectory, {recursive: true});

// Generate filename if not provided
  if (!filename) {
   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
   filename = `tts-${timestamp}.${this.format}`;
  }

// Ensure filename has correct extension
  if (!filename.endsWith(`.${this.format}`)) {
   filename += `.${this.format}`;
  }

  const fullPath = path.join(this.outputDirectory, filename);

// Convert audio data to buffer if it's a ReadableStream
  const buffer = this.audioData instanceof ReadableStream
   ? Buffer.from(await this.audioData.getReader().read().value)
   : this.audioData;

// Write file
  await fs.writeFile(fullPath, buffer);

  return fullPath;
 }


 async start(registry) {
  // Initialize service
  console.log("TextToSpeechService starting");
 }

 async stop(registry) {
  // Clean up service
  console.log("TextToSpeechService stopping");
 }

 /**
  * Reports the status of the service.
  * @param {TokenRingRegistry} registry - The package registry
  * @returns {Object} Status information.
  */
 async status(registry) {
  return {
   active: true,
   service: "TextToSpeechService"
  };
 }}