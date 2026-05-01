export type Message = {
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
  cronoTime?: number;
  files?: Array<{ name: string; url: string; type: string }>;
};

export type AttachedFile = {
  name: string;
  data: string;
  type: string;
};
