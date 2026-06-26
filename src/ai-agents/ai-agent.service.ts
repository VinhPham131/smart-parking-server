import { Injectable, Logger } from '@nestjs/common';
import { ToolRegistry } from './core/tool.registry';
import { AgentToolDefinition, buildSystemPrompt } from './promts/system.prompt';
import { LlmService } from './core/llm.service';
import { mapToolResponse } from './formatter/tool-response.mapper';

@Injectable()
export class AiAgentService {
    constructor(
        private llm: LlmService,
        private toolRegistry: ToolRegistry,
    ) { }

    private readonly logger = new Logger(AiAgentService.name);

    async handlePrompt(userPrompt: string) {
        this.logger.log('================ AI AGENT ================');
        this.logger.log(`User Prompt: ${userPrompt}`);

        const tools = this.toolRegistry.getDefinitions() as AgentToolDefinition[];
        const toolsNames = tools.map((t) => t.name).join(', ');
        this.logger.debug(`Loaded tools: ${toolsNames}`);

        const messages = [
            { role: 'system', content: buildSystemPrompt(tools) },
            { role: 'user', content: userPrompt },
        ];

        /** Upper bound on LLM calls for one user message (retries after bad JSON, unknown tool, or tool errors). Not a multi-tool agent loop. */
        const MAX_LLM_ATTEMPTS = 5;

        for (let attempt = 0; attempt < MAX_LLM_ATTEMPTS; attempt++) {
            this.logger.log(`\n--- LLM attempt ${attempt + 1}/${MAX_LLM_ATTEMPTS} ---`);

            const aiRaw = await this.llm.chat(messages);
            this.logger.debug(`Raw AI: ${aiRaw}`);

            // ── Parse JSON response ──
            let parsed: { action: string | null; args: object; response: string };
            try {
                const cleaned = aiRaw
                    .replace(/^```json\s*/i, '')
                    .replace(/^```\s*/i, '')
                    .replace(/```\s*$/i, '')
                    .trim();
                parsed = JSON.parse(cleaned);
            } catch (e) {
                this.logger.error('❌ JSON parse failed');
                messages.push({
                    role: 'user',
                    content: `Your last response was not valid JSON. Return ONLY a raw JSON object with no markdown, no code fences, no extra text. Try again.`,
                });
                continue;
            }

            const { action, args, response } = parsed;
            this.logger.debug(`Action: ${action} | Args: ${JSON.stringify(args)} | Response: ${response}`);

            if (!action) {
                return {
                    success: true,
                    data: {
                        type: 'text',
                        content: response,
                    },
                };
            }

            // ── Validate tool exists ──
            const handler = this.toolRegistry.getHandler(action);
            if (!handler) {
                this.logger.error(`Tool "${action}" not found`);
                messages.push({
                    role: 'user',
                    content: `Tool "${action}" does not exist. Available tools: ${toolsNames}. Try again with a valid tool name.`,
                });
                continue;
            }

            // ── Execute tool ──
            this.logger.log(`🔧 Calling tool: ${action}`);
            this.logger.debug(`Args: ${JSON.stringify(args)}`);

            let result: any;
            try {
                result = await handler(args);
            } catch (err) {
                this.logger.error(`Tool "${action}" threw an error: ${err.message}`);
                messages.push({
                    role: 'user',
                    content: `Tool "${action}" failed with error: ${err.message}. Please handle this gracefully in your response.`,
                });
                continue;
            }

            this.logger.debug(`Tool result: ${JSON.stringify(result)}`);

            const formatted = mapToolResponse(action, result);

            this.logger.log('✅ Final response (formatted by backend)');

            return {
                success: true,
                data: formatted,
            };
        }

        // ── Safety fallback ──
        this.logger.warn(
            `⚠️ Exhausted ${MAX_LLM_ATTEMPTS} LLM attempts without a valid JSON reply, successful tool call, or explicit no-tool response`,
        );
        return { success: false, data: 'Sorry, I was unable to complete your request. Please try again.' };
    }
}