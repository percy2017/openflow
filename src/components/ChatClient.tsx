"use client";

import { useLocalRuntime } from "@assistant-ui/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { SendHorizontal, Bot, User, Loader2, Volume2, Image } from "lucide-react";
import type { ChatModelAdapter } from "@assistant-ui/core";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clearToken } from "@/lib/auth";
import { useProfile } from "@/components/ProfileContext";
import { toast } from "sonner";

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
  role: "user" | "assistant" | "tool" | "thinking";
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
  tokens?: number;
  responseTime?: number;
  files?: Array<{ name: string; url: string; type: string }>;
};

type AttachedFile = {
  name: string;
  data: string;
  type: string;
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
  const isThinking = message.role === "thinking";
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = () => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = message.content.replace(/[#*_`~\[\]]/g, "").replace(/\n/g, " ");
    console.log("[Audio] Texto a hablar:", text.substring(0, 100));
    const utterance = new SpeechSynthesisUtterance(text);

    const loadVoice = () => {
      const voices = speechSynthesis.getVoices();
      console.log("[Audio] Voces disponibles:", voices.map(v => ({ name: v.name, lang: v.lang })));

      const spanishFemale = voices.find(
        (v) => v.lang.startsWith("es") && !v.name.toLowerCase().includes("whisper") && (
          v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("mujer") ||
          v.name.toLowerCase().includes("woman") ||
          v.name.includes("Lucia") ||
          v.name.includes("Carmen") ||
          v.name.includes("Sofia") ||
          v.name.includes("Helena") ||
          v.name.includes("Montserrat") ||
          v.name.includes("Paulina") ||
          v.name.includes("Milagra")
        )
      ) || voices.find((v) => v.lang.startsWith("es") && !v.name.toLowerCase().includes("whisper")) || voices.find((v) => v.lang.includes("es") && !v.name.toLowerCase().includes("whisper")) || voices.find((v) => v.lang.startsWith("es")) || voices[0];

      console.log("[Audio] Voz seleccionada:", spanishFemale?.name, spanishFemale?.lang);

      if (!spanishFemale) {
        console.log("[Audio] WARN: No se encontró voz española sin whisper, usando primera voz disponible");
      }

      if (spanishFemale) {
        utterance.voice = spanishFemale;
      }
      console.log("[Audio] utterance.voice:", utterance.voice);
      console.log("[Audio] utterance.rate:", utterance.rate, "utterance.pitch:", utterance.pitch, "utterance.volume:", utterance.volume);
      utterance.onend = () => {
        console.log("[Audio] Fin del habla");
        setSpeaking(false);
      };
      utterance.onerror = (e) => {
        console.log("[Audio] Error:", e);
        setSpeaking(false);
      };
      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
      setSpeaking(true);
    };

    const voices = speechSynthesis.getVoices();
    console.log("[Audio] Total voces:", voices.length);
    if (voices.length > 0) {
      loadVoice();
    } else {
      console.log("[Audio] Esperando voces...");
      speechSynthesis.onvoiceschanged = () => {
        loadVoice();
      };
    }
  };

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, [message.id]);

  if (isTool) {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div className="flex justify-start px-2">
        <div className="bg-orange-100 dark:bg-orange-900/30 text-foreground rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
          <div className="flex items-center justify-between">
            <details className="flex-1">
              <summary className="text-xs cursor-pointer text-orange-600 dark:text-orange-400 hover:text-orange-500">🔧 {message.toolName || "tool"}</summary>
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mt-1 mb-1 text-xs text-orange-600 dark:text-orange-400 border-l-2 border-orange-500 pl-2">
                  <p className="font-medium">Arguments:</p>
                  <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">{message.toolCalls[0].function.arguments}</pre>
                </div>
              )}
              <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words border-l-2 border-orange-500 pl-2 mt-1">{message.content}</p>
            </details>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-2 text-orange-600/60 hover:text-orange-600 text-xs"
            >
              {collapsed ? "▸" : "▾"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    const OMNIA_BASE = process.env.NEXT_PUBLIC_OMNIA_BASE_URL || "http://217.216.43.75:9000";
    return (
      <div className="flex justify-end px-2">
        <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
          {message.files && message.files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {message.files.map((file, i) => {
                const fileUrl = file.url?.startsWith("http") ? file.url : `${OMNIA_BASE}${file.url}`;
                return (
                  <img key={i} src={fileUrl} alt={file.name} className="max-w-[200px] rounded-lg" />
                );
              })}
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isThinking) {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div className="flex justify-start px-2">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-500 text-xs">
              <span>💭</span>
              <span className="font-medium">Thinking</span>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-blue-500/60 hover:text-blue-500 text-xs"
            >
              {collapsed ? "▸" : "▾"}
            </button>
          </div>
          {!collapsed && (
            <p className="text-xs text-muted-foreground italic whitespace-pre-wrap break-words mt-2">{message.content}</p>
          )}
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
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-300 dark:border-zinc-600">
          <span className="text-[10px] text-muted-foreground">
            {message.responseTime ? `${message.responseTime.toFixed(1)}s` : ""}
            {message.responseTime && message.tokens ? " • " : ""}
            {message.tokens ? `${message.tokens} tokens` : ""}
          </span>
          <button
            onClick={speak}
            className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors"
            title="Reproducir audio"
          >
            <Volume2 className={`w-3.5 h-3.5 ${speaking ? "text-blue-500" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatClient() {
  const { updateTokens, messages, setMessages } = useProfile();
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const runtime = useLocalRuntime(omniaAdapter, { initialMessages: [] });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("api_key");
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch("/api/conversation", { headers })
      .then((r) => r.json())
      .then((data: { messages?: any[] }) => {
        const msgs: Message[] = [];
        (data.messages || []).forEach((m) => {
          if (m.role === "user") {
            let files: Message["files"] = null;
            if (m.files) {
              console.log("[DEBUG] files received:", JSON.stringify(m.files));
              if (typeof m.files === "string") {
                const nameMatch = m.files.match(/name='([^']+)'/);
                const urlMatch = m.files.match(/url='([^']+)'/);
                const typeMatch = m.files.match(/type='([^']+)'/);
                if (nameMatch && urlMatch && typeMatch) {
                  files = [{ name: nameMatch[1], url: urlMatch[1], type: typeMatch[1] }];
                }
              } else if (Array.isArray(m.files)) {
                files = m.files.map((f: any) => {
                  console.log("[DEBUG] parsing file:", f);
                  if (typeof f === "string") {
                    const nameMatch = f.match(/name='([^']+)'/);
                    const urlMatch = f.match(/url='([^']+)'/);
                    const typeMatch = f.match(/type='([^']+)'/);
                    if (nameMatch && urlMatch && typeMatch) {
                      return { name: nameMatch[1], url: urlMatch[1], type: typeMatch[1] };
                    }
                  }
                  return f;
                }).filter(Boolean);
              }
            }
            console.log("[DEBUG] files parsed:", JSON.stringify(files));
            msgs.push({ id: `msg-${msgs.length}`, role: "user", content: m.content || "", files });
          } else if (m.role === "assistant") {
            if (m.thinking) {
              msgs.push({ id: `msg-${msgs.length}-thinking`, role: "thinking", content: m.thinking });
            }
            msgs.push({ id: `msg-${msgs.length}`, role: "assistant", content: m.content || "" });
          } else if (m.role === "tool") {
            msgs.push({
              id: `msg-${msgs.length}`,
              role: "tool",
              content: m.content || "",
              toolName: m.tool_name,
              toolCalls: m.tool_calls,
            });
          }
        });
        setMessages(msgs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;

          const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
          const maxSize = 5 * 1024 * 1024;

          if (!validTypes.includes(file.type)) {
            toast.error("Tipo de imagen no válido");
            return;
          }
          if (file.size > maxSize) {
            toast.error("Imagen muy grande (max 5MB)");
            return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = (event.target?.result as string).split(",")[1];
            setAttachedFiles((prev) => [
              ...prev,
              { name: `imagen_${Date.now()}.png`, data: base64, type: file.type },
            ]);
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    files.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} no es una imagen válida`);
        return;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} es muy grande (max 5MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(",")[1];
        setAttachedFiles((prev) => [
          ...prev,
          { name: file.name, data: base64, type: file.type },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || sending) return;

    const messageContent = input.trim();
    const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: messageContent };
    if (attachedFiles.length > 0) {
      userMsg.files = attachedFiles.map(f => ({ name: f.name, url: "", type: f.type }));
    }

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedFiles([]);
    setSending(true);

    const systemPrompt = localStorage.getItem("systemPrompt") || "";
    const msgToSend: any = { role: "user", content: messageContent };
    if (attachedFiles.length > 0) {
      msgToSend.files = attachedFiles;
    }
    const messagesToSend = [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      msgToSend,
    ];

    const token = localStorage.getItem("api_key");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const startTime = Date.now();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: messagesToSend }),
      });
      const data = await res.json();
      const responseTime = (Date.now() - startTime) / 1000;

      let tokensRemaining = null;
      try {
        const profileRes = await fetch("/api/profile", { headers });
        if (!profileRes.ok) {
          clearToken();
          window.location.href = "/login";
          return;
        }
        const profileData = await profileRes.json();
        tokensRemaining = profileData.usage?.tokens_remaining;
        updateTokens(tokensRemaining);
      } catch {
        clearToken();
        window.location.href = "/login";
        return;
      }

      if (data.message?.tool_calls && data.message.tool_calls.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `tool-${Date.now()}`,
            role: "tool",
            content: data.message.content || "",
            toolName: data.message.tool_calls[0]?.function?.name,
            toolCalls: data.message.tool_calls,
          },
        ]);
      }

      if (data.message?.thinking) {
        setMessages((prev) => [
          ...prev,
          {
            id: `thinking-${Date.now()}`,
            role: "thinking",
            content: data.message.thinking,
          },
        ]);
      }

      const text = data.message?.content || data.error || "Sin respuesta";
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: "assistant", content: text, tokens: tokensRemaining, responseTime },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: "assistant", content: "Error al enviar" },
      ]);
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
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachedFiles.map((file, i) => (
                  <div key={i} className="relative group bg-muted border border-border rounded-lg p-2 flex items-center gap-2">
                    <img
                      src={`data:${file.type};base64,${file.data}`}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <span className="text-xs text-foreground max-w-[100px] truncate">{file.name}</span>
                    <button
                      onClick={() => handleRemoveFile(i)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative flex items-end gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                multiple
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="p-2 bg-muted border border-input rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-40"
                title="Adjuntar imagen"
              >
                <Image className="w-5 h-5 text-muted-foreground" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escribe un mensaje... (Shift+Enter para nueva línea)"
                className="w-full bg-muted border border-input rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors resize-none min-h-[52px] max-h-[200px]"
                disabled={sending}
                rows={1}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || (!input.trim() && attachedFiles.length === 0)}
                className="absolute right-2 bottom-[6px] p-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}