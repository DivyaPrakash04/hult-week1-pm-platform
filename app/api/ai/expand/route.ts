export const runtime = "edge";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "AI description expansion is not configured." }, { status: 503 });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!supabaseUrl || !supabaseKey || !token) return Response.json({ error: "Sign in to use AI description expansion." }, { status: 401 });
  const authCheck = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!authCheck.ok) return Response.json({ error: "Your session is invalid. Please sign in again." }, { status: 401 });
  let title: unknown;
  try { ({ title } = await request.json()); } catch { return Response.json({ error: "Send a JSON task title." }, { status: 400 }); }
  if (typeof title !== "string" || !title.trim() || title.length > 180) return Response.json({ error: "Task title must be between 1 and 180 characters." }, { status: 400 });
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.3, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Expand a short project task title into concise useful markdown. Return JSON with one string property named description. Include a one-sentence summary and 3 to 5 concrete acceptance criteria as markdown checkboxes. Do not add assumptions about a specific technology unless title implies it." }, { role: "user", content: title.trim() }] }) });
    if (!response.ok) return Response.json({ error: "The AI service could not generate a description right now." }, { status: 502 });
    const result = await response.json(); const content = result.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content); if (typeof parsed.description !== "string" || !parsed.description.trim()) throw new Error("Invalid AI response");
    return Response.json({ description: parsed.description.trim() }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "The AI service returned an invalid response. Please try again." }, { status: 502 }); }
}
