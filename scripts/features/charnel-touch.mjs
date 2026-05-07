import { MODULE_ID } from "../constants.mjs";

const CHARNEL_TOUCH_IDENTIFIER = "charnel-touch";

export function registerCharnelTouch() {
  console.log(`${MODULE_ID} | registering Charnel Touch dialog hooks`);
  Hooks.on("renderActivityUsageDialog", onUsageDialogRender);
}

/**
 * Relabel the "Scaling Value" field in the activity usage dialog to
 * "Points to Spend" when the activity belongs to Charnel Touch.
 * Applies to both Strike and Heal Undead activities.
 */
function onUsageDialogRender(app, html) {
  try {
    const activity = app?.activity ?? app?.config?.activity;
    const item = activity?.item ?? activity?.parent;
    if (item?.system?.identifier !== CHARNEL_TOUCH_IDENTIFIER) return;

    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;

    const labels = root.querySelectorAll("label, span.label, .form-group > label");
    for (const node of labels) {
      if (/^\s*Scaling Value\s*$/i.test(node.textContent ?? "")) {
        node.textContent = "Points to Spend";
      }
    }
  } catch (err) {
    console.warn(`${MODULE_ID} | Charnel Touch dialog relabel failed`, err);
  }
}
