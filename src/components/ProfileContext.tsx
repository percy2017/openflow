"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ProfileData = {
  user: { id: number; name: string; email: string; phone: string | null; is_active: boolean; created_at: string };
  plan: { id: number; name: string; monthly_price: number; included_tokens: number };
  usage: { monthly_tokens: number; monthly_requests: number; tokens_remaining: number };
} | null;

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
  files?: Array<{ name: string; url: string; type: string }> | null;
};

type ProfileContextType = {
  profile: ProfileData;
  setProfile: (profile: ProfileData) => void;
  updateTokens: (tokens: number) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearMessages: () => void;
};

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ProfileData>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const setProfile = useCallback((data: ProfileData) => {
    setProfileState(data);
  }, []);

  const updateTokens = useCallback((tokens: number) => {
    setProfileState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        usage: { ...prev.usage, tokens_remaining: tokens },
      };
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, updateTokens, messages, setMessages, clearMessages }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
}