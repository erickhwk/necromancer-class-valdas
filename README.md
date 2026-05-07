# Necromancer (Valda's Spires of Secrets)

Foundry VTT module that adds the **Necromancer** class and the **Overlord** Grave Ambition subclass from *Valda's Spires of Secrets* (2024 ruleset) to D&D 5e.

The class ships with seven Necromancer-specific Undead Thralls as importable Actors, a custom *animate dead* spell with Skeleton / Spirit / Zombie summon profiles, and targeted JavaScript automation for features whose UX requires it.

## Compatibility

- **Foundry VTT** 13.351+ (verified)
- **dnd5e system** 5.0.0+ (verified through 5.3.2)
- Optional but recommended: **DAE** + **Times-Up** for round-based Active Effect auto-expiration

## Installation

Use the Foundry Setup → Add-on Modules → Install Module dialog with this manifest URL:

```
https://github.com/erickhwk/necromancer-class-valdas/releases/latest/download/module.json
```

## What's inside

### Class & subclass
- **Necromancer** class (Levels 1–20) — full-caster Intelligence-based, Prepared Spells progression, d6 Hit Die, Constitution + Intelligence saves
- **Overlord** Grave Ambition subclass — domination-themed manipulator with always-prepared spells (bane, command, detect thoughts, hold person, haste, slow, compulsion, confusion, dominate person, geas)

### Class features (granted at the proper level)
- L1: Spellcasting, Charnel Touch (point-pool melee spell attack with scaling damage and undead heal)
- L2: Thralls (animate ritual + summon activity for all 7 thrall types), Dead Space (descriptive)
- L3: Necromancer subclass slot, Dark Arcana (bonus action: spend slot → roll `Nd8 + INT mod` to refill the Charnel Touch pool, with JS automation)
- L5: Animate Dead (custom spell with Skeleton/Spirit/Zombie summon profiles), Critical Spellcasting (passive AE for spell crit threshold 19+ + JS Critical Failure card on natural 1)
- L7: Improved Thralls (Avoidance, Necrotic Damage, Turn Immunity)
- L14: Improved Critical Spellcasting (crit threshold 18+ via priority-100 AE, Critical Failure on 1 or 2)
- L18: Undying Servitude (reaction to save a thrall, 1 / Long Rest with slot-spend recovery)
- L20: Lichdom (creature type Undead, Truesight 120 ft, Necrotic + Poison damage immunities, Exhaustion + Poisoned condition immunities — all wired up natively via Active Effect + Trait advancement)

### Overlord features
- L3: Charnel Aura (3 activities: Aura Pulse +1 / +2 / +3 — emanation buff to all targeted thralls, +N to D20 Tests, damage rolls, AC, lasting until the start of your next turn)
- L6: Despotic Discourse (active effect: bonus to Cha (Deception, Intimidation, Persuasion) checks equal to `max(@abilities.int.mod, 1)`)
- L10: Sacrificial Thralls (reaction redirect when hit, 1 / Short or Long Rest with slot-spend recovery)
- L20: Lichdom: Tyrant (Possession + Domination Spells with Charnel Touch point costs, descriptive)

### Thralls compendium (7 actors, canonical 2024 stats)
- Bloodlurk (CR 2)
- Bone Beast (CR 1)
- Deadnaught (CR 1)
- Gorger (CR 1)
- Skeleton (CR 1/4)
- Spirit (CR 1/4)
- Zombie (CR 1/4)

## Pending features for future versions

The base experience is complete. Some advanced automations are flagged for follow-up releases:

- **Sacrificial Thralls** — auto-recovery when the necromancer expends a level 2+ spell slot is currently manual; a JS hook on slot consumption is planned.
- **Undying Servitude** — full automation (reaction trigger when a thrall hits 0 HP, hit-point application of `1 + 2 × Necromancer level`, and slot-spend recovery via level 3+ slot) is currently manual.
- **Lichdom: Tyrant Domination Spells** — the five spells (command 15 pts, dominate beast 20, dominate person 30, geas 30, dominate monster 60) are described but not yet wired as activities consuming Charnel Touch points.
- **Improved Thralls Active Effects** — Avoidance, Necrotic Damage, and Turn Immunity (Charmed/Frightened) are not yet propagated to summoned thrall actors. Manual application or a JS hook on summon is planned.
- **Dead Space** — currently descriptive; a functional Container Item with the appropriate magical-item flags and 12-item capacity is planned.

The DAE + Times-Up pairing is recommended (see `module.json` `relationships.recommends`) so that round-based AEs like Charnel Aura auto-expire at the start of the necromancer's next turn via `flags.dae.specialDuration: ["turnStartSource"]`. Without those modules, the AEs are flagged as expired in the UI but Foundry will not delete them — remove manually from each thrall's sheet.

## Credits

- **Game content** derived from *Valda's Spires of Secrets* by Mage Hand Press / community contributors. Distributed here under the [Wizards of the Coast Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy).
- **System References** (animate dead, hold person, suggestion, haste, slow, compulsion, confusion, dominate person, geas, bane, command, detect thoughts) sourced from the dnd5e system's bundled Modern SRD packs, [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
- **Module code, YAML, and packaging** — MIT, see [LICENSE](LICENSE).

This work is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. © Wizards of the Coast LLC.
