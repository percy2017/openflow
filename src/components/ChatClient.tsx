"use client";

import { useLocalRuntime } from "@assistant-ui/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { SendHorizontal, Bot, User, Loader2 } from "lucide-react";
import type { ChatModelAdapter } from "@assistant-ui/core";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MessageFromApi = {
  role: string;
  content: string;
  thinking: string | null;
  tool_calls: any[] | null;
  tool_name: string | null;
  created_at: string;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  thinking?: string | null;
  toolName?: string | null;
  toolCalls?: Array<{
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }> | null;
};

const omniaAdapter: ChatModelAdapter = {
  async run({ messages, abortSignal }) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const userContent =
      typeof lastUser?.content === "string"
        ? lastUser.content
        : Array.isArray(lastUser?.content)
          ? lastUser.content.map((p: any) => p.text || "").join("")
          : "";

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: userContent }],
      }),
      signal: abortSignal,
    });

    if (!res.ok) {
      const err = await res.text();
      return {
        content: [{ type: "text" as const, text: `Error: ${err}` }],
        status: { type: "incomplete" as const, reason: "error" as const },
      };
    }

    const data = await res.json();
    const text = data.message?.content || data.error || "Sin respuesta";

    return {
      content: [{ type: "text" as const, text }],
      status: { type: "complete" as const, reason: "stop" as const },
    };
  },
};

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  if (isTool) {
    return (
      <div className="flex justify-start px-2">
        <div className="bg-orange-100 dark:bg-orange-900/30 text-foreground rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
          <details className="mb-2">
            <summary className="text-xs cursor-pointer text-orange-600 dark:text-orange-400 hover:text-orange-500">🔧 {message.toolName || "tool"}</summary>
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mt-1 mb-1 text-xs text-orange-600 dark:text-orange-400 border-l-2 border-orange-500 pl-2">
                <p className="font-medium">Arguments:</p>
                <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">{message.toolCalls[0].function.arguments}</pre>
              </div>
            )}
            <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words border-l-2 border-orange-500 pl-2 mt-1">{message.content}</p>
          </details>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end px-2">
        <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start px-2">
      <div className="bg-zinc-200 dark:bg-zinc-800 text-foreground rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
        {message.toolCalls && message.toolCalls.length > 0 && (
          <details className="mb-2">
            <summary className="text-xs cursor-pointer text-orange-500 hover:text-orange-600">🔧 {message.toolCalls[0].function.name}</summary>
            <div className="mt-1 text-xs text-muted-foreground border-l-2 border-orange-500 pl-2">
              <pre className="whitespace-pre-wrap break-words">{message.toolCalls[0].function.arguments}</pre>
            </div>
          </details>
        )}
        {message.thinking && (
          <details className="mb-2">
            <summary className="text-xs cursor-pointer text-blue-500 hover:text-blue-600">💭 Thinking</summary>
            <p className="text-xs text-muted-foreground italic mt-1 whitespace-pre-wrap break-words border-l-2 border-blue-500 pl-2">{message.thinking}</p>
          </details>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export function ChatClient() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const runtime = useLocalRuntime(omniaAdapter, { initialMessages: [] });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("api_key");
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch("/api/conversation", { headers })
      .then((r) => r.json())
      .then((data: { messages?: MessageFromApi[] }) => {
        const msgs: Message[] = (data.messages || []).map((m, i) => ({
          id: `msg-${i}`,
          role: m.role as "user" | "assistant" | "tool",
          content: m.content || "",
          thinking: m.thinking,
          toolName: m.tool_name,
          toolCalls: m.tool_calls,
        }));
        setMessages(msgs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg = { id: `user-${Date.now()}`, role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    const systemPrompt = localStorage.getItem("systemPrompt") || "";
    const messagesToSend = [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      { role: "user" as const, content: input },
    ];

    const token = localStorage.getItem("api_key");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: messagesToSend }),
      });
      const data = await res.json();
      const text = data.message?.content || data.error || "Sin respuesta";
      const thinking = data.message?.thinking || null;
      setMessages((prev) => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: text, thinking }]);
    } catch {
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: "assistant", content: "Error al enviar" }]);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="w-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">OpenFlow Agents</h2>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                    Consola de agentes inteligentes. Escribe un mensaje para empezar.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {sending && (
                  <div className="flex justify-start px-2">
                    <div className="bg-zinc-200 dark:bg-zinc-800 text-foreground rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Procesando...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border px-4 py-4 bg-background shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Escribe un mensaje..."
                  className="w-full bg-muted border border-input rounded-xl px-4 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}