"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageCircle,
  Search,
  Send,
  ArrowLeft,
  Loader2,
  LogIn,
} from "lucide-react";

type UserMini = {
  id: string;
  firstName: string | null;
  lastName: string | null;
};

type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: UserMini;
  recipient: UserMini;
};

type Conversation = {
  id: string;
  participant: UserMini;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
};

const nameOf = (user: UserMini | null | undefined) =>
  user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "HandieHub user"
    : "HandieHub user";

const initialsOf = (user: UserMini | null | undefined) =>
  nameOf(user).charAt(0).toUpperCase();

const formatTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-NG", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

function ChatContent({ initialChatId }: { initialChatId?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const to = initialChatId ?? searchParams.get("to");

  const [me, setMe] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [extraParticipants, setExtraParticipants] = useState<
    Record<string, UserMini>
  >({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "thread">("list");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      const meRes = await fetch("/api/auth/me", {
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (!meRes.ok) {
        throw new Error(
          meRes.status === 401
            ? "Please log in to view your messages."
            : "Could not load your account.",
        );
      }
      const meData = await meRes.json();
      const userId = meData.user.id as string;

      const messagesRes = await fetch("/api/messages?limit=100", {
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (!messagesRes.ok) {
        throw new Error("Could not load your messages.");
      }
      const messagesData = await messagesRes.json();

      if (!controller.signal.aborted) {
        setMe(userId);
        setMessages(messagesData.messages ?? []);
      }

      if (to) {
        const otherId = to;
        const conversationId = `dm_${[userId, otherId].sort().join("_")}`;
        const usersRes = await fetch(`/api/users/${otherId}`, {
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (usersRes.ok) {
          const userData = await usersRes.json();
          if (!controller.signal.aborted) {
            setExtraParticipants((current) => ({
              ...current,
              [conversationId]: userData.user,
            }));
          }
        }
        if (!controller.signal.aborted && userId !== otherId) {
          setActiveId(conversationId);
          setView("thread");
        }
      }
    };

    load()
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [to]);

  const conversations = useMemo<Conversation[]>(() => {
    if (!me) return [];
    const byConversation = new Map<string, MessageRow[]>();

    for (const message of messages) {
      const rows = byConversation.get(message.conversationId) ?? [];
      rows.push(message);
      byConversation.set(message.conversationId, rows);
    }

    const list: Conversation[] = [];
    for (const [conversationId, rows] of byConversation) {
      const sorted = [...rows].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const latest = sorted[0];
      const participant =
        latest.senderId === me ? latest.recipient : latest.sender;
      list.push({
        id: conversationId,
        participant,
        lastMessage: latest.content,
        lastMessageAt: latest.createdAt,
        unreadCount: rows.filter(
          (row) => row.recipientId === me && !row.isRead,
        ).length,
      });
    }

    for (const [conversationId, participant] of Object.entries(
      extraParticipants,
    )) {
      if (!byConversation.has(conversationId)) {
        list.push({
          id: conversationId,
          participant,
          lastMessage: "Start the conversation",
          lastMessageAt: null,
          unreadCount: 0,
        });
      }
    }

    return list.sort((a, b) => {
      const aTime = a.lastMessageAt
        ? new Date(a.lastMessageAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b.lastMessageAt
        ? new Date(b.lastMessageAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return bTime - aTime;
    });
  }, [me, messages, extraParticipants]);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? null;

  const activeMessages = useMemo(() => {
    if (!activeId) return [];
    return messages
      .filter((message) => message.conversationId === activeId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }, [messages, activeId]);

  const filteredConversations = conversations.filter((conversation) =>
    nameOf(conversation.participant)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const openConversation = (conversation: Conversation) => {
    setActiveId(conversation.id);
    setView("thread");
  };

  // Mark the open thread as read once per conversation per session. The badge
  // counts are derived from `messages`, so updating the local rows is enough to
  // clear the unread state without a refetch.
  const markedConversations = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!activeId || !me) return;
    if (markedConversations.current.has(activeId)) return;

    const hasUnread = messages.some(
      (message) =>
        message.conversationId === activeId &&
        message.recipientId === me &&
        !message.isRead,
    );
    if (!hasUnread) return;

    markedConversations.current.add(activeId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages((current) =>
      current.map((message) =>
        message.conversationId === activeId &&
        message.recipientId === me &&
        !message.isRead
          ? { ...message, isRead: true }
          : message,
      ),
    );

    void fetch("/api/messages/read", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeId }),
    }).catch(() => {
      markedConversations.current.delete(activeId);
    });
  }, [activeId, me, messages]);

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !activeConversation || !me) return;

    setSending(true);
    setNewMessage("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          recipientId: activeConversation.participant.id,
          content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not send message");
      setMessages((current) => [data.message, ...current]);
    } catch (err) {
      setNewMessage(content);
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#131313] mb-2">Messages</h1>
            <p className="text-[#868686] text-sm">
              Connect with sellers and handiemen
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#868686]">
            <Loader2 className="w-6 h-6 animate-spin mr-3 text-[#5B48FC]" />
            Loading messages…
          </div>
        ) : error && !me ? (
          <div className="bg-white rounded-2xl border border-[#E8E8E8] p-10 text-center">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <h2 className="text-lg font-bold text-[#131313] mb-2">
              {error === "Please log in to view your messages."
                ? "Log in to view your messages"
                : "Could not load messages"}
            </h2>
            <p className="text-sm text-[#868686] mb-5">{error}</p>
            <Link
              href="/auth/login?next=/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B48FC] text-white font-semibold hover:bg-[#4A38E0] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Log in
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div
              className={`lg:w-1/3 bg-white rounded-2xl shadow-sm border border-[#E8E8E8] overflow-hidden flex-col ${
                view === "list" ? "flex" : "hidden lg:flex"
              }`}
            >
              <div className="p-6 border-b border-[#F3F3F3]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-[#868686]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E8E8] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#5B48FC] text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#868686]">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No conversations yet. Start one from a seller&apos;s
                    storefront.
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => openConversation(conversation)}
                      className={`w-full flex items-center gap-3 p-5 hover:bg-[#F3F3F3] transition-colors border-b border-[#F3F3F3] last:border-0 text-left ${
                        activeId === conversation.id
                          ? "bg-[#EFEDFF]"
                          : ""
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#EFEDFF] text-[#5B48FC] flex items-center justify-center font-extrabold flex-shrink-0">
                        {initialsOf(conversation.participant)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-medium text-[#131313] truncate">
                            {nameOf(conversation.participant)}
                          </h3>
                          <span className="text-xs text-[#868686] flex-shrink-0">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-[#868686] truncate mt-1">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="w-6 h-6 rounded-full bg-[#5B48FC] text-white text-xs flex items-center justify-center flex-shrink-0">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Conversation View */}
            <div
              className={`lg:w-2/3 bg-white rounded-2xl shadow-sm border border-[#E8E8E8] overflow-hidden flex-col h-full ${
                view === "thread" ? "flex" : "hidden lg:flex"
              }`}
            >
              {activeConversation ? (
                <>
                  <div className="p-6 border-b border-[#F3F3F3] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          initialChatId ? router.push("/messages") : setView("list")
                        }
                        className="p-2 rounded-full hover:bg-[#F3F3F3] transition-colors lg:hidden"
                        aria-label="Back to conversations"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="w-10 h-10 rounded-full bg-[#EFEDFF] text-[#5B48FC] flex items-center justify-center font-extrabold">
                        {initialsOf(activeConversation.participant)}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-[#131313]">
                          {nameOf(activeConversation.participant)}
                        </h3>
                        <p className="text-xs text-[#868686]">
                          Direct message
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/seller/${activeConversation.participant.id}`}
                      className="text-xs font-semibold text-[#5B48FC] hover:underline"
                    >
                      View storefront
                    </Link>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {activeMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-sm text-[#868686]">
                        <MessageCircle className="w-8 h-8 mb-2 text-gray-300" />
                        Say hello to start the conversation.
                      </div>
                    ) : (
                      activeMessages.map((message) => {
                        const mine = message.senderId === me;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-2xl ${
                                mine
                                  ? "bg-[#5B48FC] text-white"
                                  : "bg-[#F3F3F3] text-[#131313]"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <span className="text-[10px] opacity-60 block mt-1">
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {error && (
                    <p className="px-6 pb-2 text-xs text-[#EF4444]">{error}</p>
                  )}

                  <div className="p-4 border-t border-[#F3F3F3] bg-[#F3F3F3]">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void sendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(event) => setNewMessage(event.target.value)}
                        className="flex-1 pl-4 py-3 rounded-xl border border-transparent bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC] text-sm shadow-sm"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="p-3 rounded-xl bg-[#5B48FC] text-white hover:bg-[#4A38E0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Send message"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 text-[#868686]">
                  <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="text-sm">
                    Select a conversation to read and reply.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesView({
  initialChatId,
}: {
  initialChatId?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center text-[#868686]">
          <Loader2 className="w-6 h-6 animate-spin mr-3 text-[#5B48FC]" />
          Loading messages…
        </div>
      }
    >
      <ChatContent initialChatId={initialChatId} />
    </Suspense>
  );
}
