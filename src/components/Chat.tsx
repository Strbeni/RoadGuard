import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { Message as MessageType } from "@/services/chat";
import { useAuth } from "@/hooks/useAuth";

interface ChatProps {
  requestId: string;
  currentUserId: string;
  otherUserName: string;
  className?: string;
}

export const Chat = ({ requestId, currentUserId, otherUserName, className = "" }: ChatProps) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages(requestId, (fetchedMessages) => {
      setMessages(fetchedMessages);
      
      // Mark messages as read if they're from the other user
      const unreadMessages = fetchedMessages
        .filter(msg => !msg.read && msg.senderId !== currentUserId)
        .map(msg => msg.id) as string[];
      
      if (unreadMessages.length > 0) {
        markMessagesAsRead(unreadMessages);
      }
    });

    return () => unsubscribe();
  }, [requestId, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      await sendMessage({
        requestId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "Anonymous",
        text: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Say hello to {otherUserName}!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === currentUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                  message.senderId === currentUserId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="text-sm font-medium">
                  {message.senderId === currentUserId ? "You" : otherUserName}
                </div>
                <div className="text-sm">{message.text}</div>
                <div className="text-xs opacity-70 text-right mt-1">
                  {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

// Import the chat service functions
import { sendMessage, subscribeToMessages, markMessagesAsRead } from "@/services/chat";
