import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// STORY-001: CC SDK integration
// RED tests — ClaudeCodeSdkProvider does not exist yet; these will fail until GREEN.
// The test imports will throw at module load time, which counts as test failure.

describe('ClaudeCodeSdkProvider', () => {
    it('exports ClaudeCodeSdkProvider class', async () => {
        const mod = await import('../providers/claudeCodeSdkProvider.js');
        assert.ok(typeof mod.ClaudeCodeSdkProvider === 'function', 'ClaudeCodeSdkProvider must be a class');
    });

    it('getProviderType returns sdk', async () => {
        const { ClaudeCodeSdkProvider } = await import('../providers/claudeCodeSdkProvider.js');
        const fakeChannel = { appendLine: () => {}, show: () => {}, hide: () => {}, dispose: () => {}, name: 'test' } as any;
        const provider = new ClaudeCodeSdkProvider(fakeChannel);
        assert.equal(provider.getProviderType(), 'sdk');
    });

    it('getProviderName returns Claude Code SDK', async () => {
        const { ClaudeCodeSdkProvider } = await import('../providers/claudeCodeSdkProvider.js');
        const fakeChannel = { appendLine: () => {}, show: () => {}, hide: () => {}, dispose: () => {}, name: 'test' } as any;
        const provider = new ClaudeCodeSdkProvider(fakeChannel);
        assert.equal(provider.getProviderName(), 'Claude Code SDK');
    });

    it('hasValidConfiguration returns true (no API key required)', async () => {
        const { ClaudeCodeSdkProvider } = await import('../providers/claudeCodeSdkProvider.js');
        const fakeChannel = { appendLine: () => {}, show: () => {}, hide: () => {}, dispose: () => {}, name: 'test' } as any;
        const provider = new ClaudeCodeSdkProvider(fakeChannel);
        assert.equal(provider.hasValidConfiguration(), true);
    });

    it('isAuthError detects auth-related messages', async () => {
        const { ClaudeCodeSdkProvider } = await import('../providers/claudeCodeSdkProvider.js');
        const fakeChannel = { appendLine: () => {}, show: () => {}, hide: () => {}, dispose: () => {}, name: 'test' } as any;
        const provider = new ClaudeCodeSdkProvider(fakeChannel);
        assert.equal(provider.isAuthError('authentication failed'), true);
        assert.equal(provider.isAuthError('random network error'), false);
    });
});

describe('LLMProviderType', () => {
    it('includes CLAUDE_CODE_SDK variant', async () => {
        const { LLMProviderType } = await import('../providers/llmProvider.js');
        assert.ok('CLAUDE_CODE_SDK' in LLMProviderType, 'LLMProviderType must have CLAUDE_CODE_SDK');
        assert.equal(LLMProviderType.CLAUDE_CODE_SDK, 'claude-code-sdk');
    });
});

describe('LLMProviderFactory', () => {
    it('createProvider handles claude-code-sdk type', async () => {
        const { LLMProviderFactory } = await import('../providers/llmProviderFactory.js');
        const { LLMProviderType } = await import('../providers/llmProvider.js');
        const fakeChannel = { appendLine: () => {}, show: () => {}, hide: () => {}, dispose: () => {}, name: 'test' } as any;
        const factory = LLMProviderFactory.getInstance(fakeChannel);
        // Should not throw — provider instance is created
        const provider = await (factory as any).createProvider(LLMProviderType.CLAUDE_CODE_SDK);
        assert.ok(provider !== null);
        assert.equal(provider.getProviderType(), 'sdk');
    });
});
