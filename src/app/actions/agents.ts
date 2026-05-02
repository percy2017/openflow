import "server-only";

export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
}

export async function getChats(): Promise<Chat[]> {
  return [];
}

export async function getAgents(): Promise<Agent[]> {
  return [];
}
