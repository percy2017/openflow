"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Heading, List, ListOrdered, Code, Link, Eye, Edit3 } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

const toolbar = [
  { icon: Bold, label: "Negrita", wrap: ["**", "**"] },
  { icon: Italic, label: "Cursiva", wrap: ["*", "*"] },
  { icon: Heading, label: "Título", wrap: ["\n## ", ""], block: true },
  { icon: List, label: "Lista", wrap: ["\n- ", ""], block: true },
  { icon: ListOrdered, label: "Lista numerada", wrap: ["\n1. ", ""], block: true },
  { icon: Code, label: "Código", wrap: ["\n```\n", "\n```\n"], block: true },
  { icon: Link, label: "Enlace", wrap: ["[", "](url)"] },
];

export function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const applyWrap = (before: string, after: string, isBlock: boolean) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const text = isBlock && !selected ? "texto" : selected || "texto";

    const newVal = value.substring(0, start) + before + text + after + value.substring(end);
    onChange(newVal);

    requestAnimationFrame(() => {
      ta.focus();
      const cursor = start + before.length + text.length + after.length;
      ta.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="min-h-[160px] bg-muted border border-input rounded-lg px-3 py-2 text-sm text-sidebar-foreground prose prose-sm dark:prose-invert max-w-none">
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <span className="text-sidebar-foreground/40 italic">Sin contenido</span>
          )}
        </div>
      ) : (
        <div className="border border-input rounded-lg overflow-hidden focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30 transition-all">
          <div className="flex items-center gap-0.5 px-2 py-1.5 bg-muted/50 border-b border-input">
            {toolbar.map((t) => (
              <button
                key={t.label}
                onClick={() => applyWrap(t.wrap[0], t.wrap[1], t.block || false)}
                className="p-1 rounded hover:bg-muted transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground"
                title={t.label}
                type="button"
              >
                <t.icon className="w-3.5 h-3.5" />
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => setPreview(true)}
              className="p-1 rounded hover:bg-muted transition-colors text-sidebar-foreground/40 hover:text-sidebar-foreground"
              title="Vista previa"
              type="button"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Escribe en markdown..."}
            className="w-full min-h-[160px] bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none font-mono"
          />
        </div>
      )}
      {preview && (
        <div className="flex justify-end">
          <button
            onClick={() => setPreview(false)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-muted transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            Editar
          </button>
        </div>
      )}
    </div>
  );
}
