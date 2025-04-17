# repoTS - Automatic TypeScript SDK Manager

## Overview

The **repoTS** VS Code extension automatically switches the TypeScript SDK version used by the Language Server based on the current file being edited. This is especially useful in monorepos, where different packages might use different TypeScript versions.

## Features

- 🔍 **Automatic Detection**: Finds the nearest TypeScript library by recursively searching upward from the current file's directory.
- ⚙️ **SDK Switching**: Updates the `typescript.tsdk` workspace setting on-the-fly when you switch between TypeScript files in different packages.
- 🔄 **Seamless Integration**: Works silently in the background, with a reload prompt only when necessary.

## How It Works

1. When you open a TypeScript (`.ts` or `.tsx`) file, repoTS checks for the nearest `node_modules/typescript/lib` directory.
2. If found and different from the current setting, it updates the workspace setting to point to that directory.
3. A prompt to reload VS Code appears only when the TypeScript SDK path has changed.

## Requirements

- VS Code 1.99.0 or higher
- TypeScript projects with local installations of TypeScript

## Extension Settings

This extension doesn't add any new settings, but it automatically manages the built-in VS Code setting:

- `typescript.tsdk`: Path to the folder containing the TypeScript SDK (`tsserver.js`, `lib.d.ts`, etc.)

## Use Cases

Perfect for:

- Monorepos with multiple packages using different TypeScript versions
- Projects that need to switch between TypeScript versions for different parts of the codebase
- Ensuring each file is checked with the correct TypeScript version automatically

## Release Notes

### 0.0.1

- Initial release with core functionality
- Automatic TypeScript SDK detection and switching
- Prompt for reload when SDK changes

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
