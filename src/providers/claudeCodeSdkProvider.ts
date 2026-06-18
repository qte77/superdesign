import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { query } from '@anthropic-ai/claude-code';
import { LLMProvider, LLMProviderOptions, LLMMessage, LLMStreamCallback } from './llmProvider';
import { Logger } from '../services/logger';

export class ClaudeCodeSdkProvider extends LLMProvider {
    private workingDirectory: string = '';
    private currentSessionId: string | null = null;
    private modelId: string = 'claude-sonnet-4-20250514';

    constructor(outputChannel: vscode.OutputChannel) {
        super(outputChannel);
        this.initializationPromise = this.initialize();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }
        try {
            Logger.info('Starting Claude Code SDK provider initialization...');
            await this.setupWorkingDirectory();
            await this.loadConfiguration();
            this.isInitialized = true;
            Logger.info('Claude Code SDK provider initialized successfully');
        } catch (error) {
            Logger.error(`Failed to initialize Claude Code SDK provider: ${error}`);
            this.initializationPromise = null;
            this.isInitialized = false;
            throw error;
        }
    }

    private async setupWorkingDirectory(): Promise<void> {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (workspaceRoot) {
                const superdesignDir = path.join(workspaceRoot, '.superdesign');
                if (!fs.existsSync(superdesignDir)) {
                    fs.mkdirSync(superdesignDir, { recursive: true });
                }
                this.workingDirectory = superdesignDir;
            } else {
                const tempDir = path.join(os.tmpdir(), 'superdesign-claude-code-sdk');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                this.workingDirectory = tempDir;
            }
        } catch (error) {
            Logger.error(`Failed to setup working directory: ${error}`);
            this.workingDirectory = process.cwd();
        }
    }

    private async loadConfiguration(): Promise<void> {
        const config = vscode.workspace.getConfiguration('superdesign');
        const modelId = config.get<string>('claudeCodeModelId');
        if (modelId) {
            this.modelId = modelId;
        }
    }

    async query(
        prompt: string,
        options?: Partial<LLMProviderOptions>,
        abortController?: AbortController,
        onMessage?: LLMStreamCallback
    ): Promise<LLMMessage[]> {
        Logger.info('Starting Claude Code SDK query');
        await this.ensureInitialized();

        const messages: LLMMessage[] = [];

        try {
            const sdkOptions = {
                cwd: options?.cwd ?? this.workingDirectory,
                maxTurns: options?.maxTurns ?? 10,
                allowedTools: options?.allowedTools ?? [
                    'Read', 'Write', 'Edit', 'MultiEdit', 'Bash', 'LS', 'Grep', 'Glob',
                ],
                permissionMode: (options?.permissionMode ?? 'acceptEdits') as 'acceptEdits' | 'default' | 'bypassPermissions' | 'plan',
                customSystemPrompt: options?.customSystemPrompt,
                model: this.modelId,
                resume: this.currentSessionId ?? options?.resume,
            };

            const stream = query({ prompt, abortController, options: sdkOptions });

            for await (const sdkMessage of stream) {
                const message: LLMMessage = sdkMessage as unknown as LLMMessage;
                messages.push(message);

                if (sdkMessage.session_id && !this.currentSessionId) {
                    this.currentSessionId = sdkMessage.session_id;
                }

                if (onMessage) {
                    try {
                        onMessage(message);
                    } catch (callbackError) {
                        Logger.error(`Streaming callback error: ${callbackError}`);
                    }
                }
            }

            Logger.info(`Claude Code SDK query completed with ${messages.length} messages`);
            return messages;
        } catch (error) {
            Logger.error(`Claude Code SDK query failed: ${error}`);
            throw error;
        }
    }

    isReady(): boolean {
        return this.isInitialized;
    }

    async waitForInitialization(): Promise<boolean> {
        try {
            await this.ensureInitialized();
            return true;
        } catch (error) {
            Logger.error(`Claude Code SDK provider initialization failed: ${error}`);
            return false;
        }
    }

    getWorkingDirectory(): string {
        return this.workingDirectory;
    }

    hasValidConfiguration(): boolean {
        return true;
    }

    async refreshConfiguration(): Promise<boolean> {
        try {
            await this.loadConfiguration();
            return true;
        } catch (error) {
            Logger.error(`Failed to refresh Claude Code SDK configuration: ${error}`);
            return false;
        }
    }

    isAuthError(errorMessage: string): boolean {
        const authErrorPatterns = [
            'authentication failed',
            'unauthorized',
            'access denied',
            'permission denied',
            'invalid api key',
            'api key',
        ];
        const lower = errorMessage.toLowerCase();
        return authErrorPatterns.some(p => lower.includes(p));
    }

    getProviderName(): string {
        return 'Claude Code SDK';
    }

    getProviderType(): 'api' | 'binary' | 'sdk' {
        return 'sdk';
    }
}
