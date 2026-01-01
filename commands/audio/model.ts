import createSubcommandRouter from "@tokenring-ai/agent/util/subcommandRouter";
import tts from "./model/tts.js";
import stt from "./model/stt.js";

export default createSubcommandRouter({
  tts,
  stt
});
