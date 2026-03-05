import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bot, CornerDownLeft, X } from "lucide-react";

import { Button } from "@acme/ui/button";
import { ScrollArea } from "@acme/ui/scroll-area";

import { api } from "~/clients/api-client";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function parseRouteLinks(
  text: string,
): Array<{ type: "text" | "link"; value: string; href?: string }> {
  const parts: Array<{ type: "text" | "link"; value: string; href?: string }> =
    [];
  const routeRegex = /\/gas(?:\/[\w-]*)*(?=[\s.,)}\]!?]|$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = routeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "link", value: match[0], href: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

function MessageContent({ content }: { content: string }) {
  const navigate = useNavigate();
  const parts = parseRouteLinks(content);

  return (
    <div className="text-sm whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.type === "link" ? (
          <button
            key={i}
            type="button"
            className="text-primary underline underline-offset-2 hover:opacity-80"
            onClick={() => navigate({ to: part.href ?? "/" })}
          >
            {part.value}
          </button>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </div>
  );
}

export function GasChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages([...newMessages, assistantMessage]);

    try {
      const serverUrl = import.meta.env.PUBLIC_SERVER_URL;
      const response = await fetch(`${serverUrl}/api/gas-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar mensagem");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: accumulated,
            };
          }
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content:
              "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="bg-background fixed right-6 bottom-24 z-50 flex h-[500px] w-[380px] flex-col rounded-xl border shadow-xl">
          {/* Header */}
          <div className="bg-primary text-primary-foreground flex items-center gap-2 rounded-t-xl px-4 py-3">
            <Bot className="h-5 w-5" />
            <div>
              <div className="text-sm font-semibold">Assistente de Gas</div>
              <div className="text-primary-foreground/70 text-xs">
                Pergunte sobre contratos, consumo e penalidades
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-3">
            <div className="flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="text-muted-foreground flex flex-col gap-2 p-4 text-center text-sm">
                  <Bot className="mx-auto h-8 w-8 opacity-50" />
                  <p>Ola! Como posso ajudar?</p>
                  <div className="flex flex-col gap-1 text-xs">
                    <button
                      type="button"
                      className="bg-muted hover:bg-accent rounded-md px-2 py-1.5"
                      onClick={() => {
                        setInput("Qual o status do meu contrato?");
                        inputRef.current?.focus();
                      }}
                    >
                      Qual o status do meu contrato?
                    </button>
                    <button
                      type="button"
                      className="bg-muted hover:bg-accent rounded-md px-2 py-1.5"
                      onClick={() => {
                        setInput("Compare o consumo real com o programado");
                        inputRef.current?.focus();
                      }}
                    >
                      Compare consumo real vs programado
                    </button>
                    <button
                      type="button"
                      className="bg-muted hover:bg-accent rounded-md px-2 py-1.5"
                      onClick={() => {
                        setInput("Existem desvios significativos este mes?");
                        inputRef.current?.focus();
                      }}
                    >
                      Existem desvios significativos?
                    </button>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.role === "assistant" &&
                    msg.content === "" &&
                    isLoading ? (
                      <div className="flex items-center gap-1 py-1">
                        <div className="bg-foreground/40 h-1.5 w-1.5 animate-bounce rounded-full" />
                        <div className="bg-foreground/40 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0.15s]" />
                        <div className="bg-foreground/40 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0.3s]" />
                      </div>
                    ) : (
                      <MessageContent content={msg.content} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3">
            <div className="bg-muted flex items-end gap-2 rounded-lg p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua pergunta..."
                rows={1}
                className="placeholder:text-muted-foreground flex-1 resize-none bg-transparent text-sm outline-none"
                style={{ maxHeight: "80px" }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                disabled={!input.trim() || isLoading}
                onClick={sendMessage}
              >
                <CornerDownLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
