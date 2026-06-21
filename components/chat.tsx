'use client';

import { useChat, type Message } from '@ai-sdk/react';
import { Send, User, Loader2, RefreshCcw, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef, type FormEvent } from 'react';
import { Cards } from './cards';
import { parseCardsAnnotation } from '@/lib/cards';
import { statusLabel } from '@/lib/intent';

const BOT_AVATAR = '/barboy-no-bg.png';
const OUTLET_URL = 'https://burgerbangorindonesia.com/outlet';

// Keyword list from business requirement — button only appears when user explicitly asks about locations
// Leading \b only: Indonesian suffixes (-nya, -mu, -ku) must still match (e.g. "outletnya", "alamatnya")
const OUTLET_KEYWORDS =
  /\b(outlet|gerai|cabang|toko|warung|kedai|kios|booth|stan|store|lokasi|tempat|alamat|showroom)/i;

function shouldShowOutletButton(allMessages: Message[], assistantMsg: Message): boolean {
  const idx = allMessages.findIndex((m) => m.id === assistantMsg.id);
  for (let i = idx - 1; i >= 0; i--) {
    if (allMessages[i].role === 'user') {
      return OUTLET_KEYWORDS.test(allMessages[i].content);
    }
  }
  return false;
}

// "Nearest" modifier — only request geolocation when the user asks for the closest
// outlet, not for any outlet mention. \b avoids matching inside "mendekati"/"kedekatan".
const NEAREST_KEYWORDS = /\b(terdekat|dekat|sekitar)\b/i;

// Safety net: strip marker if LLM still emits it from training data residue
function stripOutletMarker(content: string) {
  return content.replace(/\{\{TEMUKAN_OUTLET\}\}/g, '').trimEnd();
}

export default function Chat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // For "outlet terdekat" intent, best-effort attach browser coords so the server
  // can rank by distance. Permission denied / timeout → submit without coords
  // (server falls back to city mode). Non-outlet messages never trigger the prompt.
  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    const wantsNearest =
      OUTLET_KEYWORDS.test(input) && NEAREST_KEYWORDS.test(input);
    if (wantsNearest && typeof navigator !== 'undefined' && navigator.geolocation) {
      e.preventDefault();
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          handleSubmit(undefined, {
            body: { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } },
          }),
        () => handleSubmit(undefined),
        { timeout: 8000, maximumAge: 300000 },
      );
      return;
    }
    handleSubmit(e);
  }

  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator =
    isLoading && (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.content);
  // Live-fetch hint: while waiting, reflect what the bot is doing (checking
  // promos / outlets / menu) instead of a generic "cooking" spinner. Derived
  // client-side from the latest user message — same intent rules as the server.
  const lastUserContent =
    [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const statusText = statusLabel(lastUserContent);

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <header className="flex items-center justify-between px-6 py-4 bg-[#96c93d] border-b border-[#86b935] shadow-sm z-10">
        <div className="flex items-center gap-3">
          <img
            src={BOT_AVATAR}
            alt="Barboy"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              BarBoy
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-medium text-white/90 uppercase tracking-wider">
                online
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setMessages([])}
          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          title="Reset Chat"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8 space-y-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex max-w-[85%] gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src={BOT_AVATAR}
                  alt="Barboy"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed bg-white border border-slate-200 text-slate-800 rounded-tl-none">
                <p>
                  Halo Bangor Rangers! Saya Barboy, asisten virtual Burger Bangor. Ada yang bisa saya bantu?
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages
            .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
            .map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[85%] gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm overflow-hidden ${
                      message.role === 'user' ? 'bg-slate-800' : ''
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <img
                        src={BOT_AVATAR}
                        alt="Barboy"
                        className="w-8 h-8 object-contain"
                      />
                    )}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      (() => {
                        const cards = parseCardsAnnotation(message.annotations);
                        // Generic website button is a fallback: only when the
                        // user asked about outlets AND we have no structured
                        // outlet cards to show (fallback mode / API down).
                        const hasOutletCard = cards.some(
                          (c) => c.type === 'outlet',
                        );
                        return (
                          <>
                            <div className="markdown-body">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {stripOutletMarker(message.content)}
                              </ReactMarkdown>
                            </div>
                            <Cards cards={cards} />
                            {!hasOutletCard &&
                              shouldShowOutletButton(messages, message) && (
                                <a
                                  href={OUTLET_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 bg-[#96c93d] hover:bg-[#86b935] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                                >
                                  <MapPin className="w-4 h-4" />
                                  Temukan Outlet
                                </a>
                              )}
                          </>
                        );
                      })()
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>

        {showTypingIndicator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src={BOT_AVATAR}
                  alt="Bot"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm text-slate-500 italic">
                  {statusText}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex gap-3 items-center mx-auto max-w-2xl">
            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
            <p className="flex-1 font-medium">{error.message}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={handleFormSubmit}
          className="max-w-4xl mx-auto relative group"
        >
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Tulis pesan..."
            disabled={isLoading}
            className="w-full pl-5 pr-14 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-inner group-focus-within:shadow-lg group-focus-within:shadow-blue-100/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-2 bottom-2 px-4 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
