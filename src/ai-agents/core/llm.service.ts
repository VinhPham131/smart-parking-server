import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class LlmService {
    private readonly logger = new Logger(LlmService.name);
    private readonly OLLAMA_URL = 'http://localhost:11434/api/chat';
    private readonly MODEL = 'llama3:8b';
    private readonly TIMEOUT_MS = 100_000;

    async chat(messages: any[]) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
            const res = await fetch(this.OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    model: this.MODEL,
                    messages,
                    stream: false,
                    format: 'json',
                    options: {
                        temperature: 0.1,
                        top_p: 0.9,
                        num_predict: 1024,
                    },
                }),
            });

            if (!res.ok) {
                const error = await res.text();
                this.logger.error(`Ollama error ${res.status}: ${error}`);
                throw new ServiceUnavailableException(`Ollama returned ${res.status}`);
            }

            const data = await res.json();

            if (!data?.message?.content) {
                this.logger.error(`Unexpected Ollama response shape: ${JSON.stringify(data)}`);
                throw new ServiceUnavailableException('Unexpected response from Ollama');
            }

            return data.message.content;

        } catch (err) {
            if (err.name === 'AbortError') {
                this.logger.error(`Ollama request timed out after ${this.TIMEOUT_MS}ms`);
                throw new ServiceUnavailableException('LLM request timed out');
            }
            throw err;
        } finally {
            clearTimeout(timeout);
        }
    }
}