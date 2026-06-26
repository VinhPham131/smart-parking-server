import { Controller, Post, Body } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/constants/config';

@Roles(UserRole.ADMIN)
@Controller('ai-agent')
export class AiAgentController {
    constructor(private agent: AiAgentService) { }

    @Post('chat')
    async chat(@Body('prompt') prompt: string) {
        return this.agent.handlePrompt(prompt);
    }
}