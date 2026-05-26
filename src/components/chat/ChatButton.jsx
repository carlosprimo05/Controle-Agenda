import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLocalAuth } from '@/lib/LocalAuthContext';
import ChatPanel from './ChatPanel';

export const getConvReadKey = (convId) => `chat_read_${convId}`;
export const markConvAsRead = (convId) => localStorage.setItem(getConvReadKey(convId), new Date().toISOString());
export const getConvLastRead = (convId) => {
  const v = localStorage.getItem(getConvReadKey(convId));
  return v ? new Date(v) : new Date(0);
};

export default function ChatButton() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useLocalAuth();

  const checkUnread = async () => {
    if (!currentUser?.username) return;
    try {
      const conversations = await base44.entities.ChatConversation.list('-last_message_at', 100);
      const myConvs = conversations.filter(c => c.participants?.includes(currentUser.username));

      let count = 0;
      for (const conv of myConvs) {
        if (conv.last_message_at && conv.last_message_sender !== currentUser.username) {
          const lastRead = getConvLastRead(conv.id);
          if (new Date(conv.last_message_at) > lastRead) count++;
        }
      }
      setUnreadCount(count);
    } catch {}
  };

  useEffect(() => {
    if (!open) checkUnread();
  }, [open, currentUser?.username]);

  useEffect(() => {
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (!open && event.type === 'create' && event.data?.sender !== currentUser?.username) {
        setUnreadCount(p => p + 1);
      }
    });
    return unsubscribe;
  }, [open, currentUser?.username]);

  const handleOpen = () => {
    setOpen(true);
    setUnreadCount(0);
    window.history.pushState({ chat: true }, '');
  };

  useEffect(() => {
    const handlePopState = () => {
      if (open) setOpen(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [open]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1 shadow-md">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat panel (full screen overlay) */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <ChatPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}