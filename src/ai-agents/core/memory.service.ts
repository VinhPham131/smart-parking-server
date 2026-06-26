import { Injectable } from '@nestjs/common';

@Injectable()
export class MemoryService {
    private store = new Map<string, any[]>();

    get(sessionId: string) {
        return this.store.get(sessionId) || [];
    }

    save(sessionId: string, messages: any[]) {
        this.store.set(sessionId, messages);
    }
}