import { MODULE_ID } from "./constants.mjs";
import { registerDarkArcana } from "./features/dark-arcana.mjs";
import { registerCharnelTouch } from "./features/charnel-touch.mjs";
import { registerCriticalSpellcasting } from "./features/critical-spellcasting.mjs";
import { registerAnimateDeadShortcut } from "./features/animate-dead-shortcut.mjs";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | initializing`);
  registerDarkArcana();
  registerCharnelTouch();
  registerCriticalSpellcasting();
  registerAnimateDeadShortcut();
});
