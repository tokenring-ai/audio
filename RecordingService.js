import naudiodon2 from 'naudiodon2';
import wav from 'wav';
import * as fs from "node:fs";

import { Service } from "@token-ring/registry";
export default class RecordingService extends Service {
 name = "RecordingService";
 description = "Provides Recording functionality";
 static constructorProperties = {
  sampleRate: {
   type: "number",
   required: false,
   description: "Sample rate for audio recording. Defaults to 16000Hz (good for speech recognition)"
  },
  channels: {
   type: "number",
   required: false,
   description: "Number of audio channels. Defaults to 1 (mono)"
  },
  format: {
   type: "string",
   required: false,
   description: "Audio format. Defaults to 'wav'"
  },
  outputPath: {
   type: "string",
   required: false,
   description: "Path where recorded audio files will be saved. Defaults to './recordings'"
  }
 };

 constructor({
              sampleRate = 48000,
              channels = 1,
              format = 'wav',
             } = {}) {
  super();
  this.sampleRate = sampleRate;
  this.channels = channels;
  this.format = format;
 }

 /**
  * Starts recording audio from the microphone
  * @param {AbortSignal} abortSignal - Signal to end recording
  * @returns The path to the recording file
  * @throws {Error} When recording is already in progress or device issues
  */
 async record(abortSignal) {
  try {
   // Create a unique filename if not provided
   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
   const name = `recording-${timestamp}`;
   const filePath = `/tmp/${name}.${this.format}`;

   // Initialize the WAV file writer
   const writer = new wav.FileWriter(filePath, {
    channels: this.channels,
    sampleRate: this.sampleRate,
    bitDepth: 16 // 16-bit audio is standard for speech
   });

   // Initialize the audio stream using naudiodon2
   const stream = naudiodon2.AudioIO({
    inOptions: {
     channelCount: this.channels,
     sampleFormat: naudiodon2.SampleFormat16Bit,
     sampleRate: this.sampleRate,
     deviceId: naudiodon2.defaultInput
    }
   });

   // Pipe the audio data to the file writer
   stream.pipe(writer);

   // Start recording
   stream.start();

   await new Promise((resolve) => abortSignal.addEventListener('abort', resolve, {once: true}));

   stream.quit();
   writer.end();

   return filePath;
  } catch (error) {
   throw new Error(`Failed to start recording: ${error.message}`);
  }
 }


 /**
  * Gets an audio file ready for transcription
  * @param filePath Path to the audio file (defaults to last recorded file)
  * @returns A Buffer or Stream suitable for the transcribe function
  * @throws {Error} When the file doesn't exist
  */
 getAudioFileForTranscription(filePath = this.filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
   throw new Error(`Audio file not found: ${filePath}`);
  }

  // Return a buffer of the file, which is compatible with the transcribe function
  return fs.readFileSync(filePath);
 }


 async start(registry) {
  // Initialize service
  console.log("RecordingService starting");
 }

 async stop(registry) {
  // Clean up service
  console.log("RecordingService stopping");
 }

 /**
  * Reports the status of the service.
  * @param {TokenRingRegistry} registry - The package registry
  * @returns {Object} Status information.
  */
 async status(registry) {
  return {
   active: true,
   service: "RecordingService"
  };
 }}