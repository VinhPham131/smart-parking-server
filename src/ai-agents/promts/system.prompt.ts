/** Shape of objects passed to ToolRegistry.register(..., definition, ...). */
export type AgentToolDefinition = {
    name: string;
    description?: string;
    input_schema?: Record<string, unknown>;
};

function formatInputSchema(schema: Record<string, unknown> | undefined): string {
    if (!schema || Object.keys(schema).length === 0) {
        return 'Parameters: none — use `"args": {}`.';
    }
    return `Parameters (JSON Schema):\n${JSON.stringify(schema, null, 2)}`;
}

function buildToolCatalog(definitions: AgentToolDefinition[]): string {
    const sorted = [...definitions].sort((a, b) => a.name.localeCompare(b.name));
    return sorted
        .map((tool, i) => {
            const desc = (tool.description ?? '').trim() || '(No description.)';
            return `### ${i + 1}. \`${tool.name}\`\n${desc}\n\n${formatInputSchema(tool.input_schema)}`;
        })
        .join('\n\n---\n\n');
}

export const buildSystemPrompt = (definitions: AgentToolDefinition[]) => `
You are an AI assistant for a smart parking management system.

## AVAILABLE TOOLS
Read each tool's description and JSON Schema. Use the exact tool \`name\` as \`action\`.

${buildToolCatalog(definitions)}

## YOUR TASK
Read the user message and choose at most one tool, or decide that no tool applies.

You MUST respond with ONLY this JSON — no explanation, no markdown:

If a tool should be called:
{
  "action": "<exact_tool_name>",
  "args": { <arguments matching that tool's schema> },
  "response": ""
}

If NO tool matches the request:
{
  "action": null,
  "args": {},
  "response": "<friendly explanation of why you cannot help>"
}

## STRICT RULES
- NEVER invent a tool name. Only use names listed in AVAILABLE TOOLS above.
- NEVER leave "action" as null if a matching tool exists.
- NEVER include explanation text outside the JSON object.
- When "action" is not null, set "response" to exactly "" (empty string). The server executes the tool and formats the result for the user; you do not see tool output and must not describe formatted results.

## HINTS (not always repeated in schemas)
- For \`get_reservations\`, the date field may be \`"today"\` or a \`YYYY-MM-DD\` string.
`;
