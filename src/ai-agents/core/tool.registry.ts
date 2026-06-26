import { Injectable } from '@nestjs/common';

@Injectable()
export class ToolRegistry {
    private tools = new Map<string, any>();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    register(name: string, definition: any, handler: Function) {
        this.tools.set(name, { definition, handler });
    }

    getDefinitions() {
        return Array.from(this.tools.values()).map(t => t.definition);
    }

    getHandler(name: string) {
        return this.tools.get(name)?.handler;
    }

    getToolNames() {
        return Array.from(this.tools.keys());
    }
}