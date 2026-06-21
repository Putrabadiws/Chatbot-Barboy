import { createDataStreamResponse, streamText } from "ai";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limiter";
import { sanitizeMessages } from "@/lib/sanitize";
import { logger } from "@/lib/logger";
import { retrieveKB } from "@/lib/knowledge-base";
import {
  getCached,
  setCache,
  createCachedStreamResponse,
} from "@/lib/response-cache";
import { getStaticGreeting, isSimpleMessage } from "@/lib/model-router";
import {
  getProvider,
  markProviderExhausted,
  isQuotaError,
} from "@/lib/providers";

export const maxDuration = 30;

const HISTORY_LIMIT = 10;

function buildSystemPrompt(today: string, kb: string, simple: boolean): string {
  if (simple) {
    return `Kamu Barboy, asisten virtual ramah Burger Bangor Indonesia. Bangor Rangers = pelanggan setia. Jawab singkat, ramah, Bahasa Indonesia. Hari ini: ${today}.`;
  }

  return `Kamu Barboy, asisten virtual Burger Bangor Indonesia. "Bangor Rangers" = pelanggan setia. Hari ini: ${today}.

Aturan:
- Bahasa Indonesia (ikuti bahasa user jika berbeda)
- Jawab dari informasi di bawah. "Tidak ada informasi" berarti TOPIK-nya memang tak ada di bawah. Jika user menambah keterangan waktu/lokasi ("hari ini", "sekarang", "di outlet X") tapi topiknya ADA (promo, menu, event, dll), TETAP sampaikan info yang tersedia — jangan menolak. Hanya bila topiknya benar-benar tak ada, jawab HANYA: "Mohon maaf, saya belum punya informasi tentang itu." — satu kalimat, jangan elaborasi. JANGAN arahkan ke website/CS
- JANGAN sebut istilah internal (tool, function, knowledge base)
- Di luar Burger Bangor → "Maaf, saya khusus membantu seputar Burger Bangor!"

Format: 1 kalimat pembuka menjawab, **bold** info kunci, bullet list untuk daftar, ### heading jika >1 topik, --- sebelum CTA. Ringkas, ramah, efisien.

Tanya promo/event/sponsorship/kemitraan/big order → sampaikan daftar yang ada di KB; untuk sponsorship/kemitraan/big order sertakan PIC & kontak.

${kb}`;
}

// Browser-supplied coordinates for "outlet terdekat". Parsed defensively — any
// malformed/missing value just yields undefined (bot falls back to city mode).
const CoordsSchema = z.object({ lat: z.number(), lng: z.number() });
function parseCoords(raw: unknown): { lat: number; lng: number } | undefined {
  const parsed = CoordsSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

// Sliding window: keep only last N messages, ensure first message is from user
function applyWindow(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
): typeof messages {
  if (messages.length <= HISTORY_LIMIT) return messages;
  const sliced = messages.slice(-HISTORY_LIMIT);
  const firstUserIdx = sliced.findIndex((m) => m.role === "user");
  return firstUserIdx > 0 ? sliced.slice(firstUserIdx) : sliced;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  let body: { messages?: unknown; coords?: unknown };
  try {
    body = await req.json();
  } catch {
    logger.warn("invalid_json", { ip });
    return new Response("Request body tidak valid", { status: 400 });
  }

  const { messages } = body;

  // --- Input sanitization & request size validation ---
  const sanitizeResult = sanitizeMessages(messages);
  if (!sanitizeResult.valid) {
    logger.warn("input_rejected", {
      ip,
      error: sanitizeResult.error,
      injection: sanitizeResult.injectionDetected ?? false,
    });
    const status = sanitizeResult.injectionDetected ? 403 : 400;
    return new Response(sanitizeResult.error, { status });
  }

  const typedMessages = messages as Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  const lastMsg = [...typedMessages].reverse().find((m) => m.role === "user");

  // --- Rate limit check ---
  const rateLimitResult = checkRateLimit(ip, lastMsg?.content);
  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.resetAt
      ? Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
      : 60;
    logger.warn("request_blocked", { ip, reason: rateLimitResult.reason });
    return new Response(
      rateLimitResult.reason === "abuse_detected"
        ? "Terdeteksi penggunaan tidak wajar. Silakan coba lagi nanti."
        : "Terlalu banyak permintaan. Silakan tunggu sebentar.",
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    );
  }

  const userContent = lastMsg?.content ?? "";

  // --- Static greeting pool — 0 tokens, no LLM call ---
  const staticResponse = getStaticGreeting(userContent);
  if (staticResponse) {
    logger.info("static_greeting", { ip });
    return createCachedStreamResponse(staticResponse);
  }

  // --- Response cache — 0 tokens ---
  const cached = getCached(userContent);
  if (cached) {
    logger.info("cache_hit", { ip, remaining: rateLimitResult.remaining });
    return createCachedStreamResponse(cached.text, cached.cards);
  }

  // --- Determine message type & select provider ---
  const simple = isSimpleMessage(userContent);
  const provider = getProvider(simple ? "greeting" : "main");

  if (!provider) {
    logger.error("all_providers_exhausted", {});
    return new Response(
      "Semua layanan AI sedang tidak tersedia. Silakan coba lagi nanti.",
      { status: 503 },
    );
  }

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // YYYY-MM-DD (Asia/Jakarta) for promo date filtering — matches API date strings.
  const todayStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });
  const coords = parseCoords(body.coords);
  const kb = simple
    ? { text: "", cards: [] }
    : await retrieveKB(userContent, { todayStr, coords });
  const systemPrompt = buildSystemPrompt(today, kb.text, simple);
  const windowedMessages = applyWindow(typedMessages);

  logger.info("chat_request", {
    ip,
    provider: provider.id,
    model: provider.modelId,
    messageCount: typedMessages.length,
    windowedCount: windowedMessages.length,
    kbLength: kb.text.length,
    cardCount: kb.cards.length,
    remaining: rateLimitResult.remaining,
  });

  try {
    return createDataStreamResponse({
      // Emit structured cards as a message annotation BEFORE the text stream, so
      // the client has them as soon as the bubble renders. JSON round-trip the
      // payload: writeMessageAnnotation wants a JSONValue, and optional card
      // fields are typed `string | undefined` (not assignable to JSONValue);
      // the round-trip also strips those `undefined`s. Cheap — cards are small.
      execute: (dataStream) => {
        if (kb.cards.length > 0) {
          dataStream.writeMessageAnnotation(
            JSON.parse(JSON.stringify({ cards: kb.cards })),
          );
        }

        const result = streamText({
          model: provider.client(provider.modelId),
          system: systemPrompt,
          messages: windowedMessages,
          // Single-step, no tools: live data (menu/promo/outlet) is fetched
          // deterministically into the system prompt by retrieveKB before the call.
          // Dropping multi-step tool-calling also removes the duplicated-answer bug.
          onFinish: ({ text }) => {
            try {
              if (lastMsg?.content && text) {
                // Strip outlet marker before caching — button logic is client-side now
                const clean = text
                  .replace(/\{\{TEMUKAN_OUTLET\}\}/g, "")
                  .trimEnd();
                // Jangan cache kalimat fallback "belum punya informasi": refusal bisa
                // transien (model sempat terlalu ketat) — kalau ke-cache ia ter-pin
                // 1 jam & menutup jawaban benar untuk pertanyaan yang sama. Anchor ^
                // ke awal kalimat; jawaban sah tak pernah diawali frasa ini.
                const isRefusal =
                  /^Mohon maaf, saya belum punya informasi/i.test(clean);
                // Jangan cache jawaban berbasis lokasi: cache di-key dari teks pertanyaan
                // saja (tanpa coords), jadi "outlet terdekat" milik satu user bisa ke-serve
                // ke user lain dgn lokasi berbeda — bocor lokasi + jarak salah.
                // Cards di-cache bersama teks agar cache hit me-render kartu yang sama.
                if (clean && !isRefusal && !coords) {
                  setCache(lastMsg.content, clean, kb.cards);
                }
              }
            } catch {
              // Cache failure should never break the response
            }
          },
        });

        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error("stream_error", { ip, provider: provider.id, error: msg });
        // Mark provider exhausted on quota errors so next request uses fallback
        if (isQuotaError(error)) {
          markProviderExhausted(provider.id);
        }
        return "Maaf, terjadi kesalahan. Silakan coba lagi.";
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("chat_error", { ip, provider: provider.id, error: msg });
    // Mark exhausted if quota-related, so next request tries fallback provider
    if (isQuotaError(error)) {
      markProviderExhausted(provider.id);
    }
    return new Response("Terjadi kesalahan. Silakan coba lagi.", {
      status: 500,
    });
  }
}
