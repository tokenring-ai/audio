import createSubcommandRouter from "@tokenring-ai/agent/util/subcommandRouter";
import stt from "./model/stt.js";
import tts from "./model/tts.js";

export default createSubcommandRouter({
  tts,
  stt
});
