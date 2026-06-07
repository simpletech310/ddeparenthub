import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Thin Anthropic wrapper. Returns null when no key is configured so callers can fall back
// to the deterministic generators (the app always works without a key).

let client: Anthropic | null = null;
export function anthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export function aiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// Ask the model for JSON only and parse it. Throws on any problem so callers can fall back.
export async function generateJson(opts: {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
}): Promise<any> {
  const a = anthropic();
  if (!a) throw new Error("no api key");
  const msg = await a.messages.create({
    model: opts.model ?? "claude-sonnet-4-5",
    max_tokens: opts.maxTokens ?? 4096,
    temperature: 0,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  // Strip code fences if present and parse the first JSON object/array.
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  const start = cleaned.search(/[\[{]/);
  if (start === -1) throw new Error("no json in response");
  return JSON.parse(cleaned.slice(start));
}
