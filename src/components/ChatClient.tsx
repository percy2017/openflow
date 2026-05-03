"use client";

import { useLocalRuntime } from "@assistant-ui/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Bot, Loader2 } from "lucide-react";
import type { ChatModelAdapter } from "@assistant-ui/core";
import { useEffect, useState, useRef, useCallback } from "react";
import { loadToken, getToken } from "@/lib/auth";
import { useProfile } from "@/components/ProfileContext";
import { toast } from "sonner";
import { MessageBubble } from "./chat/MessageBubble";
import { ChatInput } from "./chat/ChatInput";
import { QuickPrompts } from "./chat/QuickPrompts";
import type { Message, AttachedFile } from "./chat/types";
import { getIntegrations } from "@/lib/settings";
import type { PromptsData } from "@/lib/prompts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawMessage = Record<string, any>;

const omniaAdapter: ChatModelAdapter = {
  async run({ messages, abortSignal }) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const userContent =
      typeof lastUser?.content === "string"
        ? lastUser.content
        : Array.isArray(lastUser?.content)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? (lastUser.content as any[]).map((p: Record<string, string>) => p.text || "").join("")
          : "";

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: userContent }] }),
      signal: abortSignal,
    });

    if (!res.ok) {
      const err = await res.text();
      return { content: [{ type: "text" as const, text: `Error: ${err}` }], status: { type: "incomplete" as const, reason: "error" as const } };
    }

    const data = await res.json();
    return { content: [{ type: "text" as const, text: data.message?.content || data.error || "Sin respuesta" }], status: { type: "complete" as const, reason: "stop" as const } };
  },
};

export function ChatClient() {
  const { updateTokens, messages, setMessages } = useProfile();
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const runtime = useLocalRuntime(omniaAdapter, { initialMessages: [] });
  const bottomRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [prompts, setPrompts] = useState<PromptsData | null>(null);
  const [enabledIntegrations, setEnabledIntegrations] = useState<string[]>([]);

  const parseFiles = (m: RawMessage): Message["files"] => {
    if (!m.files) return null;
    if (typeof m.files === "string") {
      const nameMatch = m.files.match(/name='([^']+)'/);
      const urlMatch = m.files.match(/url='([^']+)'/);
      const typeMatch = m.files.match(/type='([^']+)'/);
      if (nameMatch && urlMatch && typeMatch) return [{ name: nameMatch[1], url: urlMatch[1], type: typeMatch[1] }];
      return null;
    }
    if (Array.isArray(m.files)) {
      return m.files.map((f: RawMessage | string) => {
        if (typeof f === "string") {
          const nameMatch = f.match(/name='([^']+)'/);
          const urlMatch = f.match(/url='([^']+)'/);
          const typeMatch = f.match(/type='([^']+)'/);
          if (nameMatch && urlMatch && typeMatch) return { name: nameMatch[1], url: urlMatch[1], type: typeMatch[1] };
          return null;
        }
        if (f && typeof f === "object" && f.url) return { name: f.name || "", url: f.url, type: f.type || "" };
        return null;
      }).filter((f): f is { name: string; url: string; type: string } => f !== null);
    }
    return null;
  };

  const parseMessages = (raw: RawMessage[]): Message[] => {
    const msgs: Message[] = [];
    raw.forEach((m) => {
      if (m.role === "user") {
        msgs.push({ id: `msg-${msgs.length}`, role: "user", content: m.content || "", files: parseFiles(m) });
      } else if (m.role === "assistant") {
        if (m.thinking) msgs.push({ id: `msg-${msgs.length}-thinking`, role: "thinking", content: m.thinking });
        if (m.tool_calls && m.tool_calls.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (m.tool_calls as { id: string; function: { name: string; arguments: string } }[]).forEach((tc, i) => {
            msgs.push({ id: `msg-${msgs.length}-tool-${i}`, role: "tool", content: "", toolName: tc.function?.name, toolCalls: [tc] });
          });
        }
        if (m.content) msgs.push({ id: `msg-${msgs.length}`, role: "assistant", content: m.content });
      } else if (m.role === "tool") {
        msgs.push({ id: `msg-${msgs.length}`, role: "tool", content: m.content || "", toolName: m.tool_name, toolCalls: m.tool_calls });
      }
    });
    return msgs;
  };

  const loadConversation = async (headers: HeadersInit): Promise<boolean> => {
    try {
      const res = await fetch("/api/conversation", { headers });
      const data: { messages?: RawMessage[] } = await res.json();
      const msgs = parseMessages(data.messages || []);
      setMessages(msgs);
      return true;
    } catch {
      return false;
    }
  };

  const loadChatData = useCallback(async () => {
    await loadToken();
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const [promptsRes, integrationsData] = await Promise.all([
      fetch("/api/prompts").then((r) => r.json()).catch(() => null),
      getIntegrations<{ enabled: string[] }>(),
    ]);
    setPrompts(promptsRes);
    setEnabledIntegrations(integrationsData.enabled || []);
    await loadConversation(headers);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChatData();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!sending && elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }, [sending]);

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
          if (!validTypes.includes(file.type)) { toast.error("Tipo de imagen no válido"); return; }
          if (file.size > 5 * 1024 * 1024) { toast.error("Imagen muy grande (max 5MB)"); return; }

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = (event.target?.result as string).split(",")[1];
            setAttachedFiles((prev) => [...prev, { name: `imagen_${Date.now()}.png`, data: base64, type: file.type }]);
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

    files.forEach((file) => {
      if (!validTypes.includes(file.type)) { toast.error(`${file.name} no es una imagen válida`); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} es muy grande (max 5MB)`); return; }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(",")[1];
        setAttachedFiles((prev) => [...prev, { name: file.name, data: base64, type: file.type }]);
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
    if (attachedFiles.length > 0) userMsg.files = attachedFiles.map((f) => ({ name: f.name, url: "", type: f.type }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedFiles([]);
    setSending(true);
    setElapsed(0);
    elapsedRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);

    const integrationsData = await getIntegrations<Record<string, unknown>>();

    const systemPrompts: string[] = [];
    if (prompts?.general?.systemPrompt) systemPrompts.push(prompts.general.systemPrompt);
    for (const key of enabledIntegrations) {
      const entry = prompts?.[key as keyof PromptsData] as { systemPrompt?: string } | undefined;
      if (entry?.systemPrompt) systemPrompts.push(entry.systemPrompt);
    }
    const mergedSystemPrompt = systemPrompts.join("\n\n---\n\n");

    const msgToSend: Record<string, unknown> = { role: "user", content: messageContent };
    if (attachedFiles.length > 0) msgToSend.files = attachedFiles;
    const messagesToSend = [
      ...(mergedSystemPrompt ? [{ role: "system" as const, content: mergedSystemPrompt }] : []),
      msgToSend,
    ];

    let integrations: Record<string, unknown> | undefined;
    const raw = integrationsData as Record<string, unknown>;
    const enabled: string[] = (raw.enabled as string[]) || [];
    integrations = {};
    for (const key of enabled) {
      if (raw[key]) integrations[key] = raw[key];
    }
    if (Object.keys(integrations).length === 0) integrations = undefined;

    const token = getToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: Record<string, any> = { messages: messagesToSend };
      if (integrations && Object.keys(integrations).length > 0) body.integrations = integrations;

      const res = await fetch("/api/chat", { method: "POST", headers, body: JSON.stringify(body) });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = `Error del servidor (${res.status})`;
        try { const errJson = JSON.parse(errText); errMsg = errJson.error || errMsg; } catch {}
        setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: "assistant", content: errMsg }]);
        setSending(false);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) await res.json();
      else await res.text();

      let tokensRemaining = null;
      try {
        const profileRes = await fetch("/api/profile", { headers });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          tokensRemaining = profileData.usage?.tokens_remaining;
          updateTokens(tokensRemaining);
        }
      } catch {}

      await loadConversation(headers);
      setSending(false);
      return;
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
                  <p className="text-muted-foreground text-sm mb-5 leading-relaxed">Consola de agentes inteligentes. Escribe un mensaje para empezar.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
                {sending && (
                  <div className="flex justify-start px-2">
                    <div className="bg-zinc-200 dark:bg-zinc-800 text-foreground rounded-2xl rounded-bl-md px-4 py-3 min-w-[160px]">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <div className="absolute inset-0 w-4 h-4 animate-ping rounded-full bg-blue-500/20" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground">Procesando</span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{elapsed}s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
            <QuickPrompts prompts={prompts} enabledIntegrations={enabledIntegrations} onSelect={(q) => { setInput(q); }} />
          </div>
        </div>

        <ChatInput
          input={input}
          sending={sending}
          attachedFiles={attachedFiles}
          onInputChange={setInput}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
        />
      </div>
    </AssistantRuntimeProvider>
  );
}
