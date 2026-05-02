"use client";

import { useRef, useState, useCallback } from "react";
import { SendHorizontal, Image, Loader2, Command } from "lucide-react";

const SLASH_PROMPTS = [
  "¿Quién eres y qué puedes hacer?",
  "¿Qué herramientas tienes disponibles?",
  "¿Qué hora y fecha tienes?",
  "📦 ¿Cuántos pedidos tengo?",
  "📱 ¿Qué instancias de Evolution tengo?",
];

type Props = {
  input: string;
  sending: boolean;
  attachedFiles: Array<{ name: string; data: string; type: string }>;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (i: number) => void;
};

export function ChatInput({ input, sending, attachedFiles, onInputChange, onSend, onFileSelect, onRemoveFile }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const showSlashMenu = showCommands && input.startsWith("/");

  const selectPrompt = useCallback(
    (prompt: string) => {
      onInputChange(prompt);
      setShowCommands(false);
      setSelectedIndex(0);
      textareaRef.current?.focus();
    },
    [onInputChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % SLASH_PROMPTS.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + SLASH_PROMPTS.length) % SLASH_PROMPTS.length);
        return;
      }
      if (e.key === "Escape") {
        setShowCommands(false);
        setSelectedIndex(0);
        e.preventDefault();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        selectPrompt(SLASH_PROMPTS[selectedIndex]);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-border bg-background shrink-0">
      <div className="max-w-3xl mx-auto px-4 py-3 relative">
        {attachedFiles.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-thin">
            {attachedFiles.map((file, i) => (
              <div key={i} className="relative group shrink-0">
                <div className="bg-muted border border-border rounded-xl p-1.5 flex items-center gap-2 pr-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`data:${file.type};base64,${file.data}`} alt={file.name} className="w-9 h-9 object-cover rounded-lg" />
                  <span className="text-xs text-foreground max-w-[80px] truncate">{file.name}</span>
                </div>
                <button
                  onClick={() => onRemoveFile(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {showSlashMenu && (
          <div
            ref={dropdownRef}
            className="absolute bottom-full left-4 right-4 mb-2 max-w-3xl mx-auto bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border flex items-center gap-1.5">
              <Command className="w-3 h-3" />
              Comandos rápidos
            </div>
            <div className="py-1 max-h-[200px] overflow-y-auto">
              {SLASH_PROMPTS.map((prompt, i) => (
                <button
                  key={prompt}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectPrompt(prompt);
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                    i === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <span className="text-muted-foreground">/</span>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            multiple
          />
          <div className="flex-1 flex items-end bg-muted border border-input rounded-xl focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30 transition-all">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="p-3 hover:bg-muted/80 transition-colors disabled:opacity-40 shrink-0 rounded-l-xl"
              title="Adjuntar imagen"
              aria-label="Adjuntar imagen"
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                onInputChange(val);
                if (!showCommands && val.startsWith("/")) setShowCommands(true);
                if (showCommands && !val.startsWith("/")) setShowCommands(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder='Escribe un mensaje... o escribe "/" para comandos'
              className="w-full bg-transparent px-1 py-3 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[48px] max-h-[200px]"
              disabled={sending}
              rows={1}
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 200) + "px";
              }}
            />
            <button
              onClick={onSend}
              disabled={sending || (!input.trim() && attachedFiles.length === 0)}
              className="p-2.5 m-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] text-muted-foreground/50">Ctrl+V para pegar imágenes</span>
          <span className="text-[10px] text-muted-foreground/50">Shift+Enter para nueva línea</span>
        </div>
      </div>
    </div>
  );
}
