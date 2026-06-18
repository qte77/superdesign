import * as vscode from 'vscode';
import { LLMProvider, LLMProviderType } from './llmProvider';
import { ClaudeApiProvider } from './claudeApiProvider';
import { ClaudeCodeProvider } from './claudeCodeProvider';
import { ClaudeCodeSdkProvider } from './claudeCodeSdkProvider';
import { Logger } from '../services/logger';

export class LLMProviderFactory {
    private static instance: LLMProviderFactory;
    private providers: Map<LLMProviderType, LLMProvider> = new Map();
    private currentProvider: LLMProvider | null = null;

    private constructor(private outputChannel: vscode.OutputChannel) {}

    static getInstance(outputChannel: vscode.OutputChannel): LLMProviderFactory {
        if (!LLMProviderFactory.instance) {
            LLMProviderFactory.instance = new LLMProviderFactory(outputChannel);
        }
        return LLMProviderFactory.instance;
    }

    async getProvider(providerType?: LLMProviderType): Promise<LLMProvider> {
        if (!providerType) {
            providerType = this.getConfiguredProviderType();
        }

        if (this.providers.has(providerType)) {
            const provider = this.providers.get(providerType)!;
            if (provider.isReady()) {
                this.currentProvider = provider;
                return provider;
            }
        }

        const provider = await this.createProvider(providerType);
        await provider.waitForInitialization();
        this.providers.set(providerType, provider);
        this.currentProvider = provider;
        return provider;
    }

    private async createProvider(providerType: LLMProviderType): Promise<LLMProvider> {
        Logger.info(`Creating provider of type: ${providerType}`);

        switch (providerType) {
            case LLMProviderType.CLAUDE_API:
                return new ClaudeApiProvider(this.outputChannel);

            case LLMProviderType.CLAUDE_CODE:
                return new ClaudeCodeProvider(this.outputChannel);

            case LLMProviderType.CLAUDE_CODE_SDK:
                return new ClaudeCodeSdkProvider(this.outputChannel);

            default:
                throw new Error(`Unknown provider type: ${providerType}`);
        }
    }

    private getConfiguredProviderType(): LLMProviderType {
        const config = vscode.workspace.getConfiguration('superdesign');
        const providerType = config.get<string>('llmProvider', 'claude-api');

        switch (providerType.toLowerCase()) {
            case 'claude-code-sdk':
                return LLMProviderType.CLAUDE_CODE_SDK;
            case 'claude-code':
                return LLMProviderType.CLAUDE_CODE;
            case 'claude-api':
            default:
                return LLMProviderType.CLAUDE_API;
        }
    }

    getCurrentProvider(): LLMProvider | null {
        return this.currentProvider;
    }

    async refreshCurrentProvider(): Promise<boolean> {
        if (!this.currentProvider) {
            return false;
        }
        try {
            return await this.currentProvider.refreshConfiguration();
        } catch (error) {
            Logger.error(`Failed to refresh current provider: ${error}`);
            return false;
        }
    }

    async switchProvider(providerType: LLMProviderType): Promise<LLMProvider> {
        Logger.info(`Switching to provider: ${providerType}`);
        const config = vscode.workspace.getConfiguration('superdesign');
        await config.update('llmProvider', providerType, vscode.ConfigurationTarget.Global);
        return await this.getProvider(providerType);
    }

    getAvailableProviders(): { type: LLMProviderType; name: string; description: string }[] {
        return [
            {
                type: LLMProviderType.CLAUDE_API,
                name: 'Claude API',
                description: 'Uses Anthropic API key to communicate with Claude via SDK'
            },
            {
                type: LLMProviderType.CLAUDE_CODE,
                name: 'Claude Code Binary',
                description: 'Uses local claude-code binary for enhanced code execution capabilities'
            },
            {
                type: LLMProviderType.CLAUDE_CODE_SDK,
                name: 'Claude Code SDK',
                description: 'Uses @anthropic-ai/claude-code SDK query() for in-process streaming without spawning a binary'
            },
        ];
    }

    async validateProvider(providerType: LLMProviderType): Promise<{ isValid: boolean; error?: string }> {
        try {
            const provider = await this.createProvider(providerType);
            const isValid = await provider.waitForInitialization();

            if (!isValid) {
                return { isValid: false, error: `Failed to initialize ${provider.getProviderName()}` };
            }

            if (!provider.hasValidConfiguration()) {
                let errorMessage = '';
                switch (providerType) {
                    case LLMProviderType.CLAUDE_API:
                        errorMessage = 'API key is required for Claude API provider';
                        break;
                    case LLMProviderType.CLAUDE_CODE:
                        errorMessage = 'Claude Code binary is not available. Please install claude-code CLI tool.';
                        break;
                    case LLMProviderType.CLAUDE_CODE_SDK:
                        errorMessage = 'Claude Code SDK is not available.';
                        break;
                }
                return { isValid: false, error: errorMessage };
            }

            return { isValid: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { isValid: false, error: errorMessage };
        }
    }

    async getProviderStatus(): Promise<{
        current: LLMProviderType;
        providers: Array<{
            type: LLMProviderType;
            name: string;
            status: 'ready' | 'error' | 'not_configured';
            error?: string;
        }>;
    }> {
        const currentType = this.getConfiguredProviderType();
        const availableProviders = this.getAvailableProviders();

        const providerStatuses = await Promise.all(
            availableProviders.map(async (provider) => {
                const validation = await this.validateProvider(provider.type);
                return {
                    type: provider.type,
                    name: provider.name,
                    status: validation.isValid ? 'ready' as const : 'error' as const,
                    error: validation.error
                };
            })
        );

        return { current: currentType, providers: providerStatuses };
    }

    dispose(): void {
        this.providers.clear();
        this.currentProvider = null;
    }
}
