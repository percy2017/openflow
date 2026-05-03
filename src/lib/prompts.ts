import { get, set } from "@/lib/db";

const PROMPTS_KEY = "prompts";

const DEFAULTS: PromptsData = {
  general: {
    systemPrompt: "Eres un asistente IA útil y conversacional. Responde en español de forma clara y profesional.",
    quickPrompts: ["¿Quién eres y qué puedes hacer?", "¿Qué herramientas tienes disponibles?", "¿Qué hora y fecha tienes?", "Cuéntame un dato interesante"],
  },
  woocommerce: {
    systemPrompt: "Eres un asistente experto en WooCommerce. Puedes consultar pedidos, productos, clientes y reportes de ventas. Responde en español con datos concretos.",
    quickPrompts: ["📦 ¿Cuántos pedidos tengo hoy?", "📊 ¿Cuáles fueron las ventas de este mes?", "🛒 ¿Qué productos se están vendiendo más?", "👥 ¿Cuántos clientes nuevos tengo esta semana?", "⏳ ¿Hay pedidos pendientes?"],
  },
  evolution: {
    systemPrompt: "Eres un asistente especializado en Evolution API, una plataforma de mensajería WhatsApp. Puedes consultar instancias, conexiones y estado del servidor. Responde en español.",
    quickPrompts: ["📱 ¿Qué instancias de Evolution tengo?", "🔌 ¿Cuáles instancias están conectadas?", "⚡ ¿El servidor de Evolution está funcionando?", "📊 ¿Cuántos mensajes se han procesado?"],
  },
  chatwoot: {
    systemPrompt: "Eres un asistente especializado en Chatwoot, una plataforma de atención al cliente. Puedes consultar conversaciones, bandejas de entrada y equipos. Responde en español.",
    quickPrompts: ["💬 ¿Cuántas conversaciones activas tengo?", "📥 ¿Qué bandejas de entrada tengo configuradas?", "👥 ¿Cuántos agentes hay en mi equipo?", "⏰ ¿Cuáles son las conversaciones sin responder?"],
  },
};

export type PromptEntry = {
  systemPrompt: string;
  quickPrompts: string[];
};

export type PromptsData = {
  general: PromptEntry;
  woocommerce: PromptEntry;
  evolution: PromptEntry;
  chatwoot: PromptEntry;
};

export function getPrompts(): PromptsData {
  const raw = get(PROMPTS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return structuredClone(DEFAULTS);
    }
  }
  const legacy = get("systemPrompt");
  if (legacy) {
    const data = structuredClone(DEFAULTS);
    data.general.systemPrompt = legacy;
    set(PROMPTS_KEY, JSON.stringify(data));
    return data;
  }
  set(PROMPTS_KEY, JSON.stringify(DEFAULTS));
  return structuredClone(DEFAULTS);
}

export function savePrompts(data: PromptsData): void {
  set(PROMPTS_KEY, JSON.stringify(data));
}

export { DEFAULTS };
