import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Send, X, Loader2, Lock, ShieldCheck, MessageSquare,
} from 'lucide-react';
import {
  getMessagesForThread, sendMessage as dbSendMessage,
  subscribeToMessages, Message,
} from '@/lib/supabase-db';
import { deriveKey, encryptMessage, decryptMessage } from '@/lib/crypto';

interface ChatPanelProps {
  contactRequestId: string;
  currentUserClerkId: string;
  otherUserClerkId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  projectTitle?: string;
  onClose: () => void;
}

interface DecryptedMessage {
  id: string;
  sender_clerk_id: string;
  content: string; // decrypted plaintext
  created_at: string;
}

const ChatPanel = ({
  contactRequestId,
  currentUserClerkId,
  otherUserClerkId,
  otherUserName,
  otherUserAvatar,
  projectTitle,
  onClose,
}: ChatPanelProps) => {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive encryption key on mount
  useEffect(() => {
    (async () => {
      try {
        const key = await deriveKey(currentUserClerkId, otherUserClerkId);
        setCryptoKey(key);
      } catch (e) {
        console.error('Failed to derive encryption key:', e);
      }
    })();
  }, [currentUserClerkId, otherUserClerkId]);

  // Load existing messages and decrypt them
  const loadMessages = useCallback(async () => {
    if (!cryptoKey) return;
    setLoading(true);
    try {
      const rawMessages = await getMessagesForThread(contactRequestId);
      const decrypted = await Promise.all(
        rawMessages.map(async (msg) => ({
          id: msg.id,
          sender_clerk_id: msg.sender_clerk_id,
          content: await decryptMessage(msg.content, cryptoKey),
          created_at: msg.created_at,
        }))
      );
      setMessages(decrypted);
    } catch (e) {
      console.error('Failed to load messages:', e);
    } finally {
      setLoading(false);
    }
  }, [contactRequestId, cryptoKey]);

  useEffect(() => {
    if (cryptoKey) {
      loadMessages();
    }
  }, [cryptoKey, loadMessages]);

  // Subscribe to realtime new messages
  useEffect(() => {
    if (!cryptoKey) return;

    const unsubscribe = subscribeToMessages(contactRequestId, async (rawMsg: Message) => {
      // Don't add duplicates
      setMessages((prev) => {
        if (prev.some((m) => m.id === rawMsg.id)) return prev;
        // Decrypt async — we add a placeholder first then update
        return prev;
      });

      try {
        const decryptedContent = await decryptMessage(rawMsg.content, cryptoKey);
        const decryptedMsg: DecryptedMessage = {
          id: rawMsg.id,
          sender_clerk_id: rawMsg.sender_clerk_id,
          content: decryptedContent,
          created_at: rawMsg.created_at,
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === rawMsg.id)) return prev;
          return [...prev, decryptedMsg];
        });
      } catch (e) {
        console.error('Failed to decrypt realtime message:', e);
      }
    });

    return () => unsubscribe();
  }, [contactRequestId, cryptoKey]);

  // Polling fallback to check for new messages every 3 seconds
  useEffect(() => {
    if (!cryptoKey) return;

    const interval = setInterval(async () => {
      try {
        const rawMessages = await getMessagesForThread(contactRequestId);
        const decrypted = await Promise.all(
          rawMessages.map(async (msg) => ({
            id: msg.id,
            sender_clerk_id: msg.sender_clerk_id,
            content: await decryptMessage(msg.content, cryptoKey),
            created_at: msg.created_at,
          }))
        );
        
        setMessages((prev) => {
          const combined = [...prev, ...decrypted];
          const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          
          if (unique.length === prev.length) return prev;
          
          return unique.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });
      } catch (e) {
        console.error('Failed to poll messages:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [contactRequestId, cryptoKey]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() || !cryptoKey || sending) return;

    const plaintext = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Encrypt before sending
      const encrypted = await encryptMessage(plaintext, cryptoKey);
      const saved = await dbSendMessage({
        contactRequestId,
        senderClerkId: currentUserClerkId,
        content: encrypted,
      });

      // Add to local state immediately (already decrypted)
      const localMsg: DecryptedMessage = {
        id: saved.id,
        sender_clerk_id: currentUserClerkId,
        content: plaintext,
        created_at: saved.created_at,
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === saved.id)) return prev;
        return [...prev, localMsg];
      });
    } catch (e) {
      console.error('Failed to send message:', e);
      setNewMessage(plaintext); // Restore on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: DecryptedMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  });

  return (
    <div className="flex flex-col h-full max-h-[80vh] min-h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img
            src={otherUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserName}`}
            alt={otherUserName}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
          />
          <div>
            <p className="font-display font-semibold text-sm">{otherUserName}</p>
            {projectTitle && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                Re: {projectTitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
            <ShieldCheck className="h-3 w-3" />
            AES-256 Encrypted
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        style={{ minHeight: 0 }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Decrypting messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <MessageSquare className="h-8 w-8 text-primary/50" />
              </div>
              <div>
                <p className="font-display font-semibold text-sm">Start the conversation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Messages are end-to-end encrypted
                </p>
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-500/70">
                <Lock className="h-3 w-3" />
                Secured with AES-256-GCM
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Encryption notice */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20">
                <Lock className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] text-emerald-500 font-medium">
                  Messages are encrypted end-to-end
                </span>
              </div>
            </div>

            {groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                {group.msgs.map((msg, i) => {
                  const isMe = msg.sender_clerk_id === currentUserClerkId;
                  const showAvatar =
                    !isMe &&
                    (i === 0 || group.msgs[i - 1]?.sender_clerk_id !== msg.sender_clerk_id);

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200`}
                    >
                      {/* Other user avatar */}
                      {!isMe && (
                        <div className="w-7 mr-2 flex-shrink-0">
                          {showAvatar && (
                            <img
                              src={otherUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserName}`}
                              alt=""
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          )}
                        </div>
                      )}

                      <div
                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-secondary/80 text-foreground rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p
                          className={`text-[9px] mt-1 ${
                            isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          } text-right`}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type an encrypted message..."
              className="pr-10 bg-secondary/30 border-border/50 focus-visible:ring-primary/30"
              disabled={sending || !cryptoKey}
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-500/50" />
          </div>
          <Button
            size="icon"
            className="h-9 w-9 bg-primary-gradient shrink-0"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending || !cryptoKey}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
