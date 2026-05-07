import { MODULE_ID } from "../constants.mjs";
import { getPrimaryHandlerId } from "../util.mjs";

const FEATURE_ID = "dark-arcana";
const CHARNEL_TOUCH_IDENTIFIER = "charnel-touch";

const recentlyHandled = new Set();

export function registerDarkArcana() {
  console.log(`${MODULE_ID} | registering Dark Arcana hooks`);
  Hooks.on("createChatMessage", onChatMessage);
  Hooks.on("renderActivityUsageDialog", onUsageDialogRender);
}

async function onChatMessage(message) {
  try {
    const rolls = message?.rolls ?? [];
    if (rolls.length === 0) return;

    const activityUuid = message.flags?.dnd5e?.activity?.uuid;
    if (!activityUuid) return;

    const activity = await fromUuid(activityUuid);
    if (!activity) return;

    const item = activity.item ?? activity.parent;
    if (item?.getFlag?.(MODULE_ID, "feature") !== FEATURE_ID) return;

    if (recentlyHandled.has(message.id)) return;
    recentlyHandled.add(message.id);
    setTimeout(() => recentlyHandled.delete(message.id), 5000);

    const actor = item.actor ?? activity.actor;
    if (!actor) return;

    if (game.user.id !== getPrimaryHandlerId(actor)) {
      console.log(`${MODULE_ID} | Dark Arcana: not primary handler, skipping`);
      return;
    }

    const restored = rolls.reduce(
      (acc, r) => acc + (Number(r?.total) || 0),
      0
    );
    console.log(`${MODULE_ID} | Dark Arcana: extracted restored=${restored} from ${rolls.length} roll(s)`);
    if (restored <= 0) return;

    const charnelTouch = actor.items.find(
      i => i.system?.identifier === CHARNEL_TOUCH_IDENTIFIER
    );
    if (!charnelTouch) {
      ui.notifications.warn(
        "Dark Arcana: Charnel Touch feature not found on this actor; pool not updated."
      );
      return;
    }

    const currentSpent = Number(charnelTouch.system?.uses?.spent ?? 0);
    if (currentSpent <= 0) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content:
          `<p><strong>Dark Arcana:</strong> Charnel Touch pool already at maximum — ${restored} potential points wasted.</p>`,
      });
      return;
    }

    const newSpent = Math.max(0, currentSpent - restored);
    const actuallyRestored = currentSpent - newSpent;
    await charnelTouch.update({ "system.uses.spent": newSpent });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content:
        `<p><strong>Dark Arcana:</strong> Charnel Touch pool regains <strong>${actuallyRestored}</strong> point${actuallyRestored === 1 ? "" : "s"}.</p>`,
    });
  } catch (err) {
    console.error(`${MODULE_ID} | Dark Arcana chat hook failed`, err);
  }
}

/**
 * Relabel the "Scaling Value" field in the activity usage dialog to
 * "Spell Slot Level" when the activity belongs to Dark Arcana.
 */
function onUsageDialogRender(app, html) {
  try {
    const activity = app?.activity ?? app?.config?.activity;
    const item = activity?.item ?? activity?.parent;
    if (item?.getFlag?.(MODULE_ID, "feature") !== FEATURE_ID) return;

    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;

    const labels = root.querySelectorAll("label, span.label, .form-group > label");
    for (const node of labels) {
      if (/^\s*Scaling Value\s*$/i.test(node.textContent ?? "")) {
        node.textContent = "Spell Slot Level";
      }
    }
  } catch (err) {
    console.warn(`${MODULE_ID} | Dark Arcana dialog relabel failed`, err);
  }
}
