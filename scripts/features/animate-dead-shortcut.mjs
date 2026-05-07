import { MODULE_ID } from "../constants.mjs";

const FEATURE_ID = "animate-dead-necromancer";
const SPELL_IDENTIFIER = "animate-dead";

/**
 * The Animate Dead (Necromancer) feat carries a utility activity named
 * "Cast Animate Dead". When the player triggers that activity, this hook
 * cancels it and instead invokes `spell.use()` on the actor's Animate Dead
 * spell — same flow as casting from the Spells tab (slot dialog, slot
 * consumption, summon profile picker).
 */
export function registerAnimateDeadShortcut() {
  console.log(`${MODULE_ID} | registering Animate Dead shortcut hook`);
  Hooks.on("dnd5e.preUseActivity", onPreUseActivity);
}

function onPreUseActivity(activity, _usageConfig, _dialogConfig, _messageConfig) {
  try {
    const item = activity?.item ?? activity?.parent;
    if (item?.getFlag?.(MODULE_ID, "feature") !== FEATURE_ID) return;

    const actor = activity?.actor;
    if (!actor) return;

    const spell = actor.items.find(i => i.system?.identifier === SPELL_IDENTIFIER);
    if (!spell) {
      ui.notifications.warn(
        "Animate Dead spell not found on this actor — make sure the L5 Animate Dead grant has been completed."
      );
      return false;
    }

    // Async fire-and-forget; we cancel the feat's activity by returning false
    // synchronously so the system doesn't post a separate utility card.
    spell.use();
    return false;
  } catch (err) {
    console.error(`${MODULE_ID} | Animate Dead shortcut hook failed`, err);
  }
}
