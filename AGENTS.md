# AI Agent Guidelines for YouTube Listen Mode Extension

## Project Purpose

This Chrome extension enhances the YouTube viewing experience by providing a simple, one-click audio-only mode. It allows users to listen to YouTube content while hiding the video player, saving bandwidth and reducing visual distraction. The extension adds a toggle button to YouTube's player controls and offers intelligent auto-enable features based on user preferences.

## Architecture Overview

### Core Components
- **content.js** - Main content script injected into YouTube pages
- **popup.js** - Extension popup UI for settings management
- **manifest.json** - Chrome extension configuration
- **styles.css** - Styling for audio-only overlay
- **features/** - Cucumber feature files and step definitions

### Key Logic Flow
1. **Button Injection**: MutationObserver detects YouTube player controls and injects toggle button
2. **Mode Toggling**: Clicking button adds/removes `ytb-listen-mode-active` class to player
3. **Auto-Enable Logic**: Priority-based system with four levels:
   - Global auto-enable (highest priority)
   - Disable list (channel-specific override)
   - Enable list (channel-specific enable)
   - Default disabled (strict force mode)
4. **Channel Detection**: Polling mechanism to extract channel name from YouTube DOM

## Code Conventions

### General Style
- Use **const** for variables that won't be reassigned
- Use **let** only when reassignment is necessary
- Use **function** declarations for named functions
- Use **arrow functions** for callbacks and inline functions
- Use **template literals** for string concatenation
- Use **early returns** to reduce nesting
- Use **optional chaining** (`?.`) when accessing nested properties
- Use **destructuring** for object/array access

### Naming Conventions
- **camelCase** for variables and functions
- **PascalCase** for constants (if used for config values)
- **UPPER_SNAKE_CASE** for global constants
- **kebab-case** for CSS classes and file names
- **Descriptive names**: `getChannelName` not `getChan`

### File Organization
- **content.js**: Main logic, keep modular with helper functions
- **popup.js**: UI interaction and Chrome storage management
- **test files**: Features in `features/`, step definitions in `features/step_definitions/`

### Error Handling
- Check for `typeof document !== 'undefined'` before DOM operations
- Use optional chaining for DOM element access
- Log errors to console with descriptive messages
- Fail gracefully when YouTube DOM structure changes

## Development Workflow

### 1. Understanding Changes
- Review the existing codebase structure
- Check `git diff` to see current branch changes
- Run existing tests to ensure baseline functionality

### 2. Making Changes
- Follow existing patterns and conventions
- Keep functions focused and single-purpose
- Add appropriate error handling
- Use constants for string values (see `ACTION` and `REASON` in content.js)

### 3. Testing Changes
- Always run `npm test` before and after changes
- Ensure all Cucumber scenarios pass (6 scenarios, 25 steps)
- Check test coverage remains acceptable
- Consider adding new feature files for significant changes

### 4. Code Review Checklist
- [ ] Code follows existing patterns
- [ ] No hard-coded strings (use constants)
- [ ] Error handling present
- [ ] Tests pass
- [ ] No console.log statements in production code (except debugging)
- [ ] Chrome extension manifest permissions appropriate

## Testing Guidelines

### Running Tests
```bash
npm test
```
Runs Cucumber tests with code coverage reporting via nyc.

### Test Structure
- **Feature Files**: Plain English scenarios in `features/*.feature`
- **Step Definitions**: JavaScript implementations in `features/step_definitions/steps.js`
- **Coverage**: nyc provides statement, branch, and function coverage

### Writing Tests
1. Add feature file with Gherkin syntax
2. Implement step definitions if needed
3. Run tests to verify coverage
4. Update TESTING.md if adding new test patterns

### Priority Logic Tests
Ensure tests cover all priority levels:
- Global auto-enable ON/OFF
- Channel in disable list
- Channel in enable list
- Channel not in any list
- Channel name not found (timeout)

## Chrome Extension Specifics

### Manifest Configuration
- Manifest v3 (check manifest.json for permissions)
- Content scripts match `*://*.youtube.com/*`
- Permissions: `activeTab`, `scripting`, `storage`
- Host permissions: YouTube domains

### Storage API
- Use `chrome.storage.local` for user settings
- Settings structure: `{ autoEnable, channelList, disableChannelList }`
- Default values: `false`, `[]`, `[]`

### Content Script Safety
- Check `typeof document !== 'undefined'` before DOM operations
- Handle YouTube's SPA navigation with `yt-navigate-finish` event
- Use MutationObserver for dynamic content
- Be defensive about YouTube DOM structure changes

### Performance Considerations
- Use debouncing for rapid events (250ms default)
- Clear intervals and timeouts to prevent memory leaks
- Poll with timeout (max 20 attempts, 500ms interval)
- Minimize DOM queries and mutations

## Git & Branching

### Branch Naming
Use descriptive branch names:
- `feature/` for new features
- `fix/` for bug fixes
- `refactor/` for code improvements
- `test/` for test additions

### Commit Messages
- Use imperative mood ("Add feature" not "Added feature")
- Reference relevant files/functions
- Keep first line under 50 characters
- Add details in body if needed

### PR Guidelines
- Include description of changes
- Reference any related issues
- Confirm all tests pass
- Update documentation if needed

## Constants Reference

### ACTION Constants (content.js)
```javascript
const ACTION = { ENABLE: 'enable', DISABLE: 'disable' };
```

### REASON Constants (content.js)
```javascript
const REASON = { 
  GLOBAL: 'global',
  NO_CHANNEL: 'noChannel', 
  DISABLE_LIST: 'disableList',
  ENABLE_LIST: 'enableList',
  DEFAULT: 'default'
};
```

### Priority Order
1. `REASON.GLOBAL` - Global auto-enable (highest)
2. `REASON.DISABLE_LIST` - Channel in disable list
3. `REASON.ENABLE_LIST` - Channel in enable list
4. `REASON.DEFAULT` - No rules match (default disabled)

## Troubleshooting Common Issues

### YouTube DOM Changes
- Channel name selectors may need updating
- Player control structure may change
- Use console.log debugging carefully
- Check browser console for errors

### Extension Loading
- Ensure manifest.json is valid
- Check permissions match current YouTube URLs
- Reload extension in chrome://extensions

### Test Failures
- Run `npm test` to see specific failures
- Check step definitions match feature files
- Verify content.js exports `getPriorityMode` correctly

## Additional Resources
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Cucumber.js Documentation](https://cucumber.io/docs/installation/javascript/)
- [YouTube Player API](https://developers.google.com/youtube/iframe_api_reference)

---
*Last Updated: Jan 22 2026*  
*Maintainer: AI Development Guidelines*