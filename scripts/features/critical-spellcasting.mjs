import { MODULE_ID } from "../constants.mjs";
import { getPrimaryHandlerId } from "../util.mjs";

const FEATURE_ID = "critical-spellcasting";
const IMPROVEMENT_ID = "critical-spellcasting-improvement";
const FLAG_TYPE = "critical-spellcasting-card";
const FLAG_APPLIED = "applied";

const recentlyHandled = new Set();

export function registerCriticalSpellcasting() {
  console.log(`${MODULE_ID} | registering Critical Spellcasting hooks`);
  Hooks.on("createChatMessage", onChatMessage);
  Hooks.on("renderChatMessageHTML", attachApplyButton);
}

async function onChatMessage(message) {
  try {
    if (recentlyHandled.has(message.id)) return;

    const rolls = message.rolls ?? [];
    if (rolls.length === 0) return;

    const dnd5eFlags = message.flags?.dnd5e;
    const rollType = dnd5eFlags?.roll?.type;
    const messageType = dnd5eFlags?.messageType;
    let activityUuid = dnd5eFlags?.activity?.uuid ?? dnd5eFlags?.activityUuid;
    // dnd5e 5.x links saves to their originating spell card message via
    // flags.dnd5e.originatingMessage. Resolve through it to find the activity.
    if (!activityUuid && dnd5eFlags?.originatingMessage) {
      const originMsg = game.messages.get(dnd5eFlags.originatingMessage);
      activityUuid = originMsg?.flags?.dnd5e?.activity?.uuid
        ?? originMsg?.flags?.dnd5e?.activityUuid
        ?? null;
    }

    // Heuristic check: does this look like a save roll?
    const flavor = String(message.flavor ?? "").toLowerCase();
    const looksLikeSave = rollType === "save"
      || messageType === "savingThrow"
      || flavor.includes("saving throw")
      || flavor.includes("save");
    if (!looksLikeSave) {
      return;
    }

    if (!activityUuid) return;

    const activity = await fromUuid(activityUuid);
    if (!activity) return;

    const sourceItem = activity.item;
    if (sourceItem?.type !== "spell") return;

    const sourceActor = activity.actor;
    if (!sourceActor) return;

    const csFeature = sourceActor.items.find(
      i => i.system?.identifier === FEATURE_ID
    );
    if (!csFeature) return;

    const csImprovement = sourceActor.items.find(
      i => i.system?.identifier === IMPROVEMENT_ID
    );
    const threshold = csImprovement ? 2 : 1;

    const naturalRoll = extractNaturalD20(rolls[0]);
    if (typeof naturalRoll !== "number") return;
    if (naturalRoll > threshold) return;

    const targetActor = await resolveTargetActor(message);
    if (!targetActor) return;

    recentlyHandled.add(message.id);
    setTimeout(() => recentlyHandled.delete(message.id), 5000);

    if (game.user.id !== getPrimaryHandlerId(sourceActor)) return;

    const hasDamage = (activity.damage?.parts?.length ?? 0) > 0;
    const originatingMessageId = dnd5eFlags?.originatingMessage ?? null;

    await postCard({
      sourceActor,
      sourceItem,
      targetActor,
      naturalRoll,
      threshold,
      hasDamage,
      activityUuid,
      originatingMessageId,
    });
  } catch (err) {
    console.error(`${MODULE_ID} | Critical Spellcasting hook failed`, err);
  }
}

function extractNaturalD20(roll) {
  if (!roll) return null;
  const fromTerms = roll.terms?.[0]?.results?.find(r => !r.discarded)?.result;
  if (typeof fromTerms === "number") return fromTerms;
  const fromDice = roll.dice?.[0]?.results?.[0]?.result;
  if (typeof fromDice === "number") return fromDice;
  return null;
}

async function resolveTargetActor(message) {
  const speaker = message.speaker;
  if (speaker?.token) {
    const scene = game.scenes.get(speaker.scene) ?? canvas.scene;
    const tokenDoc = scene?.tokens?.get(speaker.token);
    if (tokenDoc?.actor) return tokenDoc.actor;
  }
  if (speaker?.actor) {
    const actor = game.actors.get(speaker.actor);
    if (actor) return actor;
  }
  return null;
}


async function postCard({
  sourceActor, sourceItem, targetActor, naturalRoll, threshold,
  hasDamage, activityUuid, originatingMessageId,
}) {
  const headline = `<em>${targetActor.name}</em> rolled a <strong>${naturalRoll}</strong> on its save against <em>${sourceItem.name}</em> — <strong>Critical Failure</strong>. The save automatically fails. Skip the spell's normal damage; roll the critical damage below instead.`;

  const damageBlock = hasDamage
    ? `<p>Critical damage doubles the spell's damage dice (Foundry handles upcast/cantrip scaling automatically). Click below to roll.</p>`
    : `<p><em>This spell has no damage component.</em></p>`;

  const button = hasDamage
    ? `<div class="card-buttons"><button type="button" data-action="critical-spellcasting-roll"><i class="fa-solid fa-dice-d20"></i> Roll Critical Damage</button></div>`
    : "";

  const content = `
<div class="dnd5e2 chat-card">
  <section class="card-header description">
    <header class="summary">
      <img class="gold-icon" src="${sourceItem.img || "icons/svg/skull.svg"}" alt="Critical Spellcasting">
      <div class="name-stacked border">
        <span class="title">Critical Spellcasting</span>
        <span class="subtitle">Necromancer ${threshold === 2 ? "L14+" : "L5+"}</span>
      </div>
    </header>
    <section class="details card-content">
      <div class="wrapper">
        <p>${headline}</p>
        ${damageBlock}
      </div>
    </section>
  </section>
  ${button}
</div>`.trim();

  const ownerIds = game.users
    .filter(u => sourceActor.testUserPermission(u, "OWNER"))
    .map(u => u.id);
  const whisper = ownerIds.length < game.users.size ? ownerIds : [];

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
    content,
    whisper,
    flags: {
      [MODULE_ID]: {
        type: FLAG_TYPE,
        targetUuid: targetActor.uuid,
        sourceActorUuid: sourceActor.uuid,
        sourceItemUuid: sourceItem.uuid,
        activityUuid,
        originatingMessageId,
      },
    },
  });
}

function attachApplyButton(message, html) {
  if (message.getFlag(MODULE_ID, "type") !== FLAG_TYPE) return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  const button = root?.querySelector('button[data-action="critical-spellcasting-roll"]');
  if (!button) return;

  if (message.getFlag(MODULE_ID, FLAG_APPLIED)) {
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-check"></i> Rolled';
    return;
  }

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    await rollAndApplyCriticalDamage(message, button);
  });
}

async function rollAndApplyCriticalDamage(message, button) {
  try {
    const activityUuid = message.getFlag(MODULE_ID, "activityUuid");
    const originatingMessageId = message.getFlag(MODULE_ID, "originatingMessageId");
    if (!activityUuid) return;

    const activity = await fromUuid(activityUuid);
    if (!activity?.rollDamage) {
      ui.notifications.warn(
        "Critical Spellcasting: activity not found or doesn't support damage rolls."
      );
      return;
    }

    // Read the cast's slot level from the original spell card to scale upcasts
    // correctly. Cantrip scaling is handled by Foundry from character level.
    const originMsg = originatingMessageId ? game.messages.get(originatingMessageId) : null;
    const spellLevel = originMsg?.flags?.dnd5e?.use?.spellLevel
      ?? originMsg?.flags?.dnd5e?.use?.castLevel
      ?? null;

    // Foundry doubles damage dice via `isCritical: true` on rollDamage's
    // config (see dnd5e source ~line 28654). dnd5e applies it to every damage
    // part, respects upcast/cantrip scaling, and posts the roll to chat.
    // The resulting damage card has the standard Apply button — the DM/player
    // applies the damage manually (auto-apply is left to MIDI-QOL or similar).
    const rollConfig = { isCritical: true };
    if (spellLevel != null) rollConfig.spellLevel = spellLevel;

    await activity.rollDamage(rollConfig, { configure: false });

    await message.setFlag(MODULE_ID, FLAG_APPLIED, true);
    if (button) {
      button.disabled = true;
      button.innerHTML = '<i class="fa-solid fa-check"></i> Rolled';
    }
  } catch (err) {
    console.error(`${MODULE_ID} | Critical Spellcasting roll failed`, err);
  }
}
