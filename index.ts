import {z} from "zod";

export const AudioConfigSchema = z.object({
  defaultProvider: z.string(),
  providers: z.record(z.string(), z.any())
}).optional();


export {default as AudioService} from "./AudioService.ts";
export {default as AudioProvider} from "./AudioProvider.ts";