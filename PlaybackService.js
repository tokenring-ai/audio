import naudiodon2 from 'naudiodon2';
import wav from 'wav';
import * as fs from "node:fs";
import * as path from "node:path";

import { Service } from "@token-ring/registry";
export default class PlaybackService extends Service {
 name = "PlaybackService";
 description = "Provides Playback functionality";
 static constructorProperties = {
  sampleRate: {
   type: "number",
   required: false,
   description: "Sample rate for audio playback. Defaults to 16000Hz"
  },
  channels: {
   type: "number",
   required: false,
   description: "Number of audio channels. Defaults to 1 (mono)"
  },
  inputPath: {
   type: "string",
   required: false,
   description: "Path where audio files to be played are located. Defaults to './recordings'"
  }
 };

 constructor({
              sampleRate = 16000,
              channels = 1,
              inputPath = './recordings'
             } = {}) {
  super();
  this.sampleRate = sampleRate;
  this.channels = channels;
  this.inputPath = inputPath;

  this.stream = null;
  this.reader = null;
  this.isPlaying = false;
  this.currentFilePath = '';
 }

 /**
  * Starts playing an audio file
  * @param filename Audio filename (with or without extension)
  * @returns The path to the audio file being played
  * @throws {Error} When playback is already in progress or file issues
  */
 async startPlayback(filename) {
  if (this.isPlaying) {
   throw new Error('Playback is already in progress.');
  }

  try {
   // Determine file path
   let filePath = filename;

   // If filename doesn't have a path, assume it's in the inputPath
   if (!path.isAbsolute(filename) && !filename.includes('/') && !filename.includes('\\')) {
    // Add extension if not provided
    if (!path.extname(filename)) {
     filePath = `${this.inputPath}/${filename}.wav`;
    } else {
     filePath = `${this.inputPath}/${filename}`;
    }
   }

   // Check if file exists
   if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file not found: ${filePath}`);
   }

   this.currentFilePath = filePath;

   // Initialize the WAV file reader
   this.reader = new wav.Reader();

   // When format is parsed, set up the audio output
   this.reader.on('format', (format) => {
    // Initialize the audio stream using naudiodon2
    this.stream = naudiodon2.AudioIO({
     outOptions: {
      channelCount: format.channels,
      sampleFormat: naudiodon2.SampleFormat16Bit,
      sampleRate: format.sampleRate,
      deviceId: -1, // Use default output device
     }
    });

    // Pipe the file data to the audio output
    this.reader.pipe(this.stream);

    // Start playback
    this.stream.start();
   });

   // Handle end of playback
   this.reader.on('end', () => {
    this.stopPlayback();
   });

   // Start reading the file
   const fileStream = fs.createReadStream(filePath);
   fileStream.pipe(this.reader);

   this.isPlaying = true;
   return this.currentFilePath;
  } catch (error) {
   throw new Error(`Failed to start playback: ${error.message}`);
  }
 }

 /**
  * Stops the current playback
  * @returns The path to the file that was being played
  * @throws {Error} When no playback is in progress
  */
 async stopPlayback() {
  if (!this.isPlaying || !this.stream) {
   throw new Error('No playback in progress.');
  }

  try {
   // Stop the audio stream
   this.stream.quit();

   // Reset playback state
   this.isPlaying = false;
   this.stream = null;
   this.reader = null;

   return this.currentFilePath;
  } catch (error) {
   throw new Error(`Failed to stop playback: ${error.message}`);
  }
 }

 /**
  * Plays an audio file for a specified duration (or until it ends)
  * @param filename Audio filename
  * @param durationMs Optional duration in milliseconds to play
  * @returns The path to the audio file
  * @throws {Error} When playback is already in progress or file issues
  */
 async playForDuration(filename, durationMs) {
  await this.startPlayback(filename);

  if (durationMs) {
   return new Promise((resolve, reject) => {
    setTimeout(async () => {
     try {
      const filePath = await this.stopPlayback();
      resolve(filePath);
     } catch (error) {
      reject(error);
     }
    }, durationMs);
   });
  }

  // If no duration specified, return a promise that resolves when playback ends
  return new Promise((resolve, reject) => {
   this.reader.on('end', () => {
    resolve(this.currentFilePath);
   });

   this.reader.on('error', (err) => {
    reject(err);
   });
  });
 }

 /**
  * List available audio files in the input directory
  * @param extension Optional file extension filter (without the dot)
  * @returns Array of filenames
  */
 listAudioFiles(extension = 'wav') {
  try {
   if (!fs.existsSync(this.inputPath)) {
    return [];
   }

   const files = fs.readdirSync(this.inputPath);
   return files.filter(file => path.extname(file).toLowerCase() === `.${extension}`);
  } catch (error) {
   throw new Error(`Failed to list audio files: ${error.message}`);
  }
 }


 async start(registry) {
  // Initialize service
  console.log("PlaybackService starting");
 }

 async stop(registry) {
  // Clean up service
  console.log("PlaybackService stopping");
 }

 /**
  * Reports the status of the service.
  * @param {TokenRingRegistry} registry - The package registry
  * @returns {Object} Status information.
  */
 async status(registry) {
  return {
   active: true,
   service: "PlaybackService"
  };
 }}
