"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MessageCircle,
  User,
  Search,
  Send,
  MoreVertical,
  ArrowLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

const PRIMARY = "#5B48FC";

const MOCK_CONVERSATIONS = [
  {
    id: "conv_1",
    participant: {
      id: "seller_1",
      name: "Ambience Furniture",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      isOnline: true,
      isVerified: true,
    },
    lastMessage: "Your order has been confirmed and will be delivered soon.",
    lastMessageTime: "2:30 PM",
    unreadCount: 2,
  },
  {
    id: "conv_2",
    participant: {
      id: "seller_2",
      name: "Comfort Living",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      isOnline: false,
      isVerified: true,
    },
    lastMessage: "Thank you for your purchase!",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
  },
  {
    id: "conv_3",
    participant: {
      id: "seller_3",
      name: "WoodWorks Nigeria",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      isOnline: true,
      isVerified: false,
    },
    lastMessage: "Do you have any questions about the product?",
    lastMessageTime: "Monday",
    unreadCount: 1,
  },
];

const MOCK_MESSAGES = [
  { id: "m1", sender: "seller", text: "Hi! I received your order inquiry.", time: "10:00 AM", isRead: true },
  { id: "m2", sender: "buyer", text: "Hello, is the black chair still available?", time: "10:05 AM", isRead: true },
  { id: "m3", sender: "seller", text: "Yes, it's available. We have 3 in stock.", time: "10:10 AM", isRead: true },
  { id: "m4", sender: "buyer", text: "Great! I'd like to place an order for 2.", time: "10:15 AM", isRead: true },
];

export default function ChatPage() {
  const [activeConversation, setActiveConversation] = useState(MOCK_CONVERSATIONS[0]);
  const [newMessage, setNewMessage] = useState("");
  const [view, setView] = useState("list");

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#131313] mb-2">Messages</h1>
            <p className="text-[#868686] text-sm">Connect with sellers and handiemen</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:w-1/3 bg-white rounded-2xl shadow-sm border border-[#E8E8E8] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#F3F3F3]">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-[#868686]" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E8E8] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#5B48FC] text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {MOCK_CONVERSATIONS.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`flex items-center gap-3 p-5 hover:bg-[#F3F3F3] transition-colors border-b border-[#F3F3F3] last:border-0 ${
                    activeConversation.id === conv.id ? "bg-[#EFEDFF] border-[#5B48FC]" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={conv.participant.avatar}
                      alt={conv.participant.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white"
                    />
                    {conv.participant.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-[#131313] truncate">
                        {conv.participant.name}
                      </h3>
                      <span className="text-xs text-[#868686]">{conv.lastMessageTime}</span>
                    </div>
                    <p className="text-sm text-[#868686] truncate mt-1">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-6 h-6 rounded-full bg-[#5B48FC] text-white text-xs flex items-center justify-center">
                      {conv.unreadCount}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation View */}
          <div className="lg:w-2/3 bg-white rounded-2xl shadow-sm border border-[#E8E8E8] overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-[#F3F3F3] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-full hover:bg-[#F3F3F3] transition-colors hidden lg:block">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <img
                    src={activeConversation.participant.avatar}
                    alt={activeConversation.participant.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-[#131313]">
                      {activeConversation.participant.name}
                    </h3>
                    <p className="text-xs text-[#868686]">
                      {activeConversation.participant.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-[#F3F3F3] text-[#868686]">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {MOCK_MESSAGES.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "buyer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.sender === "buyer"
                        ? "bg-[#5B48FC] text-white"
                        : "bg-[#F3F3F3] text-[#131313]"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <span className="text-[10px] opacity-60 block mt-1">
                      {msg.time}
                      {msg.sender === "buyer" && msg.isRead ? (
                        <span className="ml-1 text-[#5B48FC]">✓✓</span>
                      ) : null}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#F3F3F3] bg-[#F3F3F3]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 pl-4 py-3 rounded-xl border border-transparent bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC] text-sm shadow-sm"
                />
                <button
                  onClick={() => {}}
                  disabled={!newMessage.trim()}
                  className="p-3 rounded-xl bg-[#5B48FC] text-white hover:bg-[#4A38E0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
