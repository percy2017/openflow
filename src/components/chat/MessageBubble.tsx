"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import type { Message } from "./types";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

function ToolBubble({ message }: { message: Message }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex justify-start px-2">
      <div className="bg-orange-100 dark:bg-orange-900/30 text-foreground rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
        <div className="flex items-center justify-between">
          <details className="flex-1">
            <summary className="text-xs cursor-pointer text-orange-600 dark:text-orange-400 hover:text-orange-500">
              🔧 {message.toolName || "tool"}
            </summary>
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mt-1 mb-1 text-xs text-orange-600 dark:text-orange-400 border-l-2 border-orange-500 pl-2">
                <p className="font-medium">Arguments:</p>
                <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
                  {typeof message.toolCalls[0].function.arguments === "string"
                    ? message.toolCalls[0].function.arguments
                    : JSON.stringify(message.toolCalls[0].function.arguments, null, 2)}
                </pre>
              </div>
            )}
            <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words border-l-2 border-orange-500 pl-2 mt-1">{message.content}</p>
          </details>
          <button onClick={() => setCollapsed(!collapsed)} className="ml-2 text-orange-600/60 hover:text-orange-600 text-xs">
            {collapsed ? "▸" : "▾"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: Message }) {
  const OMNIA_BASE = process.env.NEXT_PUBLIC_OMNIA_BASE_URL || "http://217.216.43.75:9000";
  return (
    <div className="flex justify-end px-2">
      <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
        {message.files && message.files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.files.map((file, i) => {
              const fileUrl = file.url?.startsWith("http") ? file.url : `${OMNIA_BASE}${file.url}`;
              // eslint-disable-next-line @next/next/no-img-element
              return <img key={i} src={fileUrl} alt={file.name} className="max-w-[200px] rounded-lg" />;
            })}
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}

function ThinkingBubble({ message }: { message: Message }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex justify-start px-2">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-500 text-xs">
            <span>💭</span>
            <span className="font-medium">Thinking</span>
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="text-blue-500/60 hover:text-blue-500 text-xs">
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

function AssistantBubble({ message }: { message: Message }) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesLoadedRef = useRef(false);

  const isSpeechSupported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  useEffect(() => {
    if (!isSpeechSupported) return;
    const check = () => { if (speechSynthesis.getVoices().length > 0) voicesLoadedRef.current = true; };
    check();
    speechSynthesis.addEventListener("voiceschanged", check);
    return () => speechSynthesis.removeEventListener("voiceschanged", check);
  }, [isSpeechSupported]);

  const speak = () => {
    if (!isSpeechSupported) return;
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const text = message.content.replace(/[#*_`~\[\]]/g, "").replace(/\n/g, " ").trim();
    if (!text) return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 0.9;

    const voices = speechSynthesis.getVoices();
    const spanishVoice =
      voices.find((v) => v.lang.startsWith("es") && !v.name.toLowerCase().includes("whisper")) ||
      voices.find((v) => v.lang.includes("es") && !v.name.toLowerCase().includes("whisper")) ||
      voices.find((v) => v.lang.startsWith("es")) ||
      voices[0];

    if (spanishVoice) utterance.voice = spanishVoice;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        speechSynthesis.cancel();
      }
    };
  }, [message.id]);

  return (
    <div className="flex justify-start px-2">
      <div className="bg-zinc-200 dark:bg-zinc-800 text-foreground rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
        {message.toolCalls && message.toolCalls.length > 0 && (
          <details className="mb-2">
            <summary className="text-xs cursor-pointer text-orange-500 hover:text-orange-600">
              🔧 {message.toolCalls[0].function.name}
            </summary>
            <div className="mt-1 text-xs text-muted-foreground border-l-2 border-orange-500 pl-2">
              <pre className="whitespace-pre-wrap break-words">
                {typeof message.toolCalls[0].function.arguments === "string"
                  ? message.toolCalls[0].function.arguments
                  : JSON.stringify(message.toolCalls[0].function.arguments, null, 2)}
              </pre>
            </div>
          </details>
        )}
        <MarkdownRenderer content={message.content} />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-300 dark:border-zinc-600">
          <span className="text-[10px] text-muted-foreground">
            {message.cronoTime
              ? `${message.cronoTime}s`
              : message.responseTime
                ? `${message.responseTime.toFixed(1)}s`
                : ""}
            {(message.responseTime || message.cronoTime) && message.tokens ? " • " : ""}
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

export function MessageBubble({ message }: { message: Message }) {
  if (message.role === "tool") return <ToolBubble message={message} />;
  if (message.role === "user") return <UserBubble message={message} />;
  if (message.role === "thinking") return <ThinkingBubble message={message} />;
  return <AssistantBubble message={message} />;
}
