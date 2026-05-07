# Changelog

All notable changes to this module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] — 2026-05-07

### Fixed
- Release workflow now compiles the LevelDB compendium packs in CI before
  zipping. The 1.0.0 release shipped empty compendiums because the
  workflow only zipped the YAML sources (which `.gitignore` excludes from
  the artifact via the `-x packs/_source/*` flag).

## [1.0.0] — 2026-05-07

Initial release. The Necromancer class and Overlord subclass from
*Valda's Spires of Secrets* (2024 ruleset) are fully playable from level 1
through level 20, with native dnd5e advancement, two compendium packs, and
JavaScript automation for the features whose UX requires it.
