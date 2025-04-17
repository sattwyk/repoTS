import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import mockfs from 'mock-fs';
import * as extension from '../extension';
import * as sinon from 'sinon';

// Import the functions directly for testing
const { findNearestTypeScriptLib, updateTypeScriptSDK, promptReload } = extension;

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	suite('findNearestTypeScriptLib', () => {
		teardown(() => {
			mockfs.restore();
		});

		test('should find typescript lib when it exists in parent directory', () => {
			// Setup mock file system
			mockfs({
				'/workspace': {
					'package.json': '{}',
					'node_modules': {
						'typescript': {
							'lib': {
								'tsserver.js': 'console.log("tsserver")'
							}
						}
					},
					'src': {
						'file.ts': 'const x = 1;'
					}
				}
			});

			const result = findNearestTypeScriptLib('/workspace/src/file.ts');
			assert.strictEqual(result, path.resolve('/workspace/node_modules/typescript/lib'));
		});

		test('should find typescript lib in the closest parent directory', () => {
			// Setup mock file system with nested node_modules
			mockfs({
				'/workspace': {
					'package.json': '{}',
					'node_modules': {
						'typescript': {
							'lib': {
								'tsserver.js': 'console.log("root tsserver")'
							}
						}
					},
					'packages': {
						'package-a': {
							'package.json': '{}',
							'node_modules': {
								'typescript': {
									'lib': {
										'tsserver.js': 'console.log("package-a tsserver")'
									}
								}
							},
							'src': {
								'file.ts': 'const x = 1;'
							}
						}
					}
				}
			});

			const result = findNearestTypeScriptLib('/workspace/packages/package-a/src/file.ts');
			assert.strictEqual(result, path.resolve('/workspace/packages/package-a/node_modules/typescript/lib'));
		});

		test('should return null when no typescript lib is found', () => {
			// Setup mock file system with no typescript
			mockfs({
				'/workspace': {
					'package.json': '{}',
					'node_modules': {},
					'src': {
						'file.ts': 'const x = 1;'
					}
				}
			});

			const result = findNearestTypeScriptLib('/workspace/src/file.ts');
			assert.strictEqual(result, null);
		});
	});

	suite('updateTypeScriptSDK', () => {
		let getConfigurationStub: sinon.SinonStub;
		let mockConfig: {
			get: sinon.SinonStub;
			update: sinon.SinonStub;
		};

		setup(() => {
			// Create stubs for the workspace configuration
			mockConfig = {
				get: sinon.stub(),
				update: sinon.stub().resolves(undefined)
			};

			getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration');
			getConfigurationStub.returns(mockConfig as any);
		});

		teardown(() => {
			// Restore original behavior
			sinon.restore();
		});

		test('should update SDK path when different from current setting', async () => {
			mockConfig.get.withArgs('tsdk').returns('/old/path');

			const newPath = '/new/typescript/path';
			await updateTypeScriptSDK(newPath);

			assert.strictEqual(mockConfig.get.calledWith('tsdk'), true);
			assert.strictEqual(mockConfig.update.calledWith('tsdk', newPath, vscode.ConfigurationTarget.Workspace), true);
		});

		test('should not update SDK path when same as current setting', async () => {
			const sdkPath = '/typescript/path';
			mockConfig.get.withArgs('tsdk').returns(sdkPath);

			await updateTypeScriptSDK(sdkPath);

			assert.strictEqual(mockConfig.get.calledWith('tsdk'), true);
			assert.strictEqual(mockConfig.update.called, false);
		});

		test('should handle null SDK path', async () => {
			mockConfig.get.withArgs('tsdk').returns(null);

			await updateTypeScriptSDK(null);

			assert.strictEqual(mockConfig.get.calledWith('tsdk'), true);
			assert.strictEqual(mockConfig.update.called, false);
		});
	});

	suite('promptReload', () => {
		let showInformationMessageStub: sinon.SinonStub;
		let executeCommandStub: sinon.SinonStub;

		setup(() => {
			showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage').resolves('Reload' as any);
			executeCommandStub = sinon.stub(vscode.commands, 'executeCommand').resolves();
		});

		teardown(() => {
			sinon.restore();
		});

		test('should prompt to reload when SDK changes', async () => {
			await promptReload('Test message');

			assert.strictEqual(showInformationMessageStub.calledOnce, true);
			assert.strictEqual(showInformationMessageStub.firstCall.args[0], 'Test message');
			assert.deepStrictEqual(showInformationMessageStub.firstCall.args[1], { modal: false });
			assert.deepStrictEqual(showInformationMessageStub.firstCall.args[2], 'Reload');

			assert.strictEqual(executeCommandStub.calledOnce, true);
			assert.strictEqual(executeCommandStub.firstCall.args[0], 'workbench.action.reloadWindow');
		});

		test('should not reload if user dismisses the prompt', async () => {
			showInformationMessageStub.resolves(undefined);

			await promptReload('Test message');

			assert.strictEqual(showInformationMessageStub.calledOnce, true);
			assert.strictEqual(executeCommandStub.called, false);
		});
	});

});
