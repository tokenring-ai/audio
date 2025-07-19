import { experimental_transcribe as transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Service } from "@token-ring/registry";
import { AbortSignal } from "node:abort-controller";
export default class TranscriptionService extends Service {
 name = "TranscriptionService";
 description = "Provides Transcription functionality";
 static constructorProperties = {
  model: {
   type: "string",
   required: false,
   description: "The transcription model to use. Defaults to 'whisper-1'"
  },
  language: {
   type: "string",
   required: false,
   description: "Language code for transcription (if supported by model)"
  },
  timestampGranularity: {
   type: "string",
   required: false,
   description: "Timestamp granularity level (e.g., 'word'). Provider-specific."
  },
  timeout: {
   type: "number",
   required: false,
   description: "Timeout in milliseconds for transcription request"
  }
 };

 constructor({ model = 'whisper-1', language, timestampGranularity, timeout } = {}) {
  super();
  this.model = model;
  this.language = language;
  this.timestampGranularity = timestampGranularity;
  this.timeout = timeout;
  this.transcript = null;
 }
 
 /**
  * Reports the status of the service.
  * @param {TokenRingRegistry} registry - The package registry
  * @returns {Object} Status information.
  */
 async status(registry) {
  return {
   active: true,
   service: "TranscriptionService"
  };
 }
 /**
  * Transcribes the audio file and stores the result
  * @param audioFile The audio file to transcribe
  * @returns The transcription result
  * @throws {Error} When no audio file is provided
  */
 async transcribe(audioFile) {
  if (!audioFile) {
   throw new Error('No audio file provided for transcription.');
  }

  const options = {
   model: openai.transcription(this.model),
   audio: audioFile,
  };

  // Add provider-specific options if specified
  if (this.timestampGranularity) {
   options.providerOptions = {
    openai: {
     timestampGranularities: [this.timestampGranularity],
    },
   };
  }

  // Add language option if specified
  if (this.language) {
   options.language = this.language;
  }

  // Add timeout if specified
  if (this.timeout) {
   options.abortSignal = AbortSignal.timeout(this.timeout);
  }

  return await transcribe(options);
 }

}