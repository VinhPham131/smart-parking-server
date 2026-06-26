export const TOOL_FORMAT_MAP: Record<string, string> = {
    get_reservations: `
You are a plain text formatter. You ONLY output plain text — never JSON, never objects, never curly braces.

OUTPUT FORMAT (copy this structure exactly):
Reservations Summary
Total: {total} | Approved: {approved} | Rejected: {rejected} | Pending: {pending}

---
Reservations List:
N. License Plate: {license_plate}
   • Check-in: YYYY-MM-DD HH:MM
   • Check-out: YYYY-MM-DD HH:MM
   • Status: Approved|Rejected|Pending

RULES:
- Convert ISO timestamps like "2026-05-04T01:00:00.000Z" → "2026-05-04 01:00"
- Include ALL reservations, numbered sequentially
- Output ONLY the formatted text above — no JSON, no curly braces, no code blocks
`,

    update_reservation_status: `
Return EXACTLY one sentence:

"Reservation <reservation_code> has been <status>."

Rules:
- Replace placeholders with real values
- status must be lowercase (approved/rejected/pending)
- No JSON
- No extra text
`,

    bulk_update_reservation_status: `
Return EXACTLY one sentence:

"<count> reservations on <date> have been <status>."

Rules:
- Replace placeholders with real values
- status must be lowercase
- No JSON
- No extra text
`,
};