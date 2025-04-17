// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Effect } from 'effect';

/**
 * Finds the nearest TypeScript library directory by recursively searching upward
 * from the current file's directory.
 * 
 * @param currentFile Absolute path of the current file being edited
 * @returns The path to typescript/lib directory if found, null otherwise
 */
export function findNearestTypeScriptLib(currentFile: string): string | null {
	return Effect.runSync(
		Effect.gen(function* (_) {
			// Start from the directory containing the current file
			let currentDir = path.dirname(currentFile);
			const rootDir = path.parse(currentDir).root;

			// Continue searching until we reach the root directory
			while (currentDir !== rootDir) {
				const tsLibPath = path.join(currentDir, 'node_modules', 'typescript', 'lib');
				const tsServerJsPath = path.join(tsLibPath, 'tsserver.js');

				const fileExists = yield* _(
					Effect.try({
						try: () => fs.existsSync(tsServerJsPath),
						catch: () => false
					})
				);

				if (fileExists) {
					return tsLibPath;
				}

				// Move up to the parent directory
				const parentDir = path.dirname(currentDir);

				// If we're already at the root, break to avoid infinite loop
				if (parentDir === currentDir) {
					break;
				}

				currentDir = parentDir;
			}

			// Return null if no TypeScript library is found
			return null;
		})
	);
}

/**
 * Updates the TypeScript SDK path in workspace settings if it differs from the current setting.
 * 
 * @param path The path to the TypeScript SDK directory
 * @returns A promise that resolves when the update is complete
 */
export async function updateTypeScriptSDK(path: string | null): Promise<void> {
	return Effect.runPromise(
		Effect.gen(function* (_) {
			// Get the current TypeScript configuration
			const config = vscode.workspace.getConfiguration('typescript');
			const currentPath = config.get<string | null>('tsdk');

			// Only update if the path is different and not null
			if (path !== null && path !== currentPath) {
				yield* _(
					Effect.try({
						try: () => config.update('tsdk', path, vscode.ConfigurationTarget.Workspace),
						catch: (error) => {
							console.error('Failed to update TypeScript SDK path:', error);
							return Promise.resolve();
						}
					})
				);
			}
		})
	);
}

/**
 * Prompts the user to reload the VS Code window.
 * 
 * @param message The message to display in the prompt
 * @returns A promise that resolves when the user responds to the prompt
 */
export async function promptReload(message: string): Promise<void> {
	const reloadAction = 'Reload';

	try {
		const selection = await vscode.window.showInformationMessage(
			message,
			{ modal: false },
			reloadAction
		);

		if (selection === reloadAction) {
			await vscode.commands.executeCommand('workbench.action.reloadWindow');
		}
	} catch (error) {
		console.error('Error in promptReload:', error);
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "repoTS" is now active');

	// Function to handle TypeScript file opening
	const handleTypescriptFile = async (document: vscode.TextDocument) => {
		// Check if this is a TypeScript file
		if (!document.fileName.endsWith('.ts') && !document.fileName.endsWith('.tsx')) {
			return;
		}

		try {
			// Find the nearest TypeScript library
			const tsLibPath = findNearestTypeScriptLib(document.fileName);

			// If no TypeScript library found, don't do anything
			if (!tsLibPath) {
				return;
			}

			// Get the current TypeScript SDK setting
			const config = vscode.workspace.getConfiguration('typescript');
			const currentTsdk = config.get<string>('tsdk');

			// Only update if the path differs from the current setting
			if (tsLibPath !== currentTsdk) {
				await updateTypeScriptSDK(tsLibPath);

				// Prompt for reload only if we've changed the SDK
				await promptReload(
					`TypeScript SDK has been updated to use the version at ${tsLibPath}. ` +
					`A reload is required for the changes to take effect.`
				);
			}
		} catch (error) {
			console.error('Error handling TypeScript file:', error);
		}
	};

	// Register event handler for file open
	const fileOpenHandler = vscode.workspace.onDidOpenTextDocument(handleTypescriptFile);
	context.subscriptions.push(fileOpenHandler);

	// Handle currently open TypeScript file, if any
	if (vscode.window.activeTextEditor) {
		handleTypescriptFile(vscode.window.activeTextEditor.document);
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }
