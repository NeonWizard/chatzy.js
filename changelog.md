# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2021-08-03
### Added
- Added `type` field to `message` event object, to differentiate normal message and action message.

### Removed
- Removed `error` event emission.

## [1.2.0] - 2021-08-03
### Changed
- `system_message` -> `systemMessage`.

### Added
- `userJoined` event.
- `userLeft` event.

## [1.1.1] - 2021-08-02
### Fixed
- No longer emits `system_message` event concerning self.
- Properly handle and ignore (for now) embed messages (type C).
- Fetch room name upon join if name was undefined.

## [1.1.0] - 2021-07-31
### Added
- Moved system messages from `message` event to `system_message` event.

### Changed
- No longer emits `message` event on messages from self.

[1.2.1]: https://github.com/NeonWizard/chatzy.js/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/NeonWizard/chatzy.js/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/NeonWizard/chatzy.js/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/NeonWizard/chatzy.js/compare/v1.0.0...v1.1.0