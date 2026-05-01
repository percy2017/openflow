"use client";

import { useRef } from "react";
import { SendHorizontal, Image, Loader2 } from "lucide-react";

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

  return (
    <div className="border-t border-border bg-background shrink-0">
      <div className="max-w-3xl mx-auto px-4 py-3">
        {attachedFiles.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-thin">
            {attachedFiles.map((file, i) => (
              <div key={i} className="relative group shrink-0">
                <div className="bg-muted border border-border rounded-xl p-1.5 flex items-center gap-2 pr-3">
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
            >
              <Image className="w-5 h-5 text-muted-foreground" />
            </button>
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="Escribe un mensaje..."
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
