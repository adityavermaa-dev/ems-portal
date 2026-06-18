import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useSocket } from "../hooks/useSocket";
import { formatDate, cx } from "../utils/helpers";
import { PanelHeader, EmptyState } from "../components/ui";

export function Messages() {
  const { user, setNotice } = useOutletContext();
  const conversations = useAsync(api.conversations, []);
  const usersState = useAsync(() => api.users(), []);
  const [active, setActive] = useState(null);
  const [content, setContent] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socket = useSocket();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [localMessages, setLocalMessages] = useState([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;
    
    if (!active) {
      setLocalMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    setLocalMessages([]); // Clear messages immediately on user switch

    api.conversation(active.id)
      .then(data => {
        if (isCancelled) return;
        const msgs = data?.messages || [];
        setLocalMessages(msgs);
        setLoadingMessages(false);
        
        const unreadIds = msgs
          .filter(m => m && m.receiverId === user.id && !m.isRead)
          .map(m => m.id);
        
        if (unreadIds.length > 0) {
          api.markConversationRead(active.id).then(() => {
            if (!isCancelled) conversations.refresh();
          }).catch(console.error);
        }
      })
      .catch(err => {
        if (isCancelled) return;
        console.error("Failed to load messages:", err);
        setLocalMessages([]);
        setLoadingMessages(false);
        setNotice("Failed to load messages");
      });

    return () => {
      isCancelled = true;
    };
  }, [active?.id, user?.id]); // Only refetch when active user changes

  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (users) => setOnlineUsers(new Set(users));
    const handleUserOnline = ({ userId }) => setOnlineUsers(prev => { const next = new Set(prev); next.add(userId); return next; });
    const handleUserOffline = ({ userId }) => setOnlineUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
    
    const handleNewMessage = (message) => {
      if (active && (message.senderId === active.id || message.receiverId === active.id)) {
        setLocalMessages(prev => [...prev, message]);
        if (message.receiverId === user.id) {
          api.markConversationAsRead(active.id).then(() => {
            conversations.refresh();
          }).catch(console.error);
        }
      } else {
        conversations.refresh();
      }
    };

    const handleUserTyping = ({ userId, isTyping }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (isTyping) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    socket.on('online_users', handleOnlineUsers);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('online_users', handleOnlineUsers);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, active?.id, user?.id]); // Removed conversations dependency to prevent re-attaching on every load

  function handleType(e) {
    setContent(e.target.value);
    if (!socket || !active) return;
    
    socket.emit('typing', { receiverId: active.id, isTyping: true });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { receiverId: active.id, isTyping: false });
    }, 1000);
  }

  async function send(event) {
    event.preventDefault();
    if (!active || !content.trim()) return;
    const currentContent = content;
    try {
      setContent("");
      if (socket) socket.emit('typing', { receiverId: active.id, isTyping: false });
      const msg = await api.sendMessage({ receiverId: active.id, content: currentContent });
      setLocalMessages(prev => [...prev, msg]);
      conversations.refresh();
    } catch (error) {
      setContent(currentContent);
      setNotice(error.message);
    }
  }

  const contacts = [
    ...(conversations.data || []).map((item) => item.user).filter(Boolean),
    ...(usersState.data || []).filter((item) => item.id !== user.id),
  ].filter((contact, index, list) => contact && list.findIndex((item) => item.id === contact.id) === index);

  return (
    <section className={cx("messages-layout", active && "has-active-chat")}>
      <aside className="conversation-list">
        <PanelHeader title="Messages" />
        {contacts.length === 0 && <EmptyState text="No conversations yet. Super Admin can start one from the user list." />}
        {contacts.map((contact) => (
          <button key={contact.id} className={cx(active?.id === contact.id && "active")} onClick={() => setActive(contact)}>
            <strong>
              {contact.name}
              {onlineUsers.has(contact.id) && <span style={{display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', marginLeft: 6}} title="Online"></span>}
            </strong>
            <small>{contact.email}</small>
          </button>
        ))}
      </aside>
      <div className="thread">
        <PanelHeader title={
          active ? (
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <button className="mobile-back" onClick={() => setActive(null)} aria-label="Back" style={{ border: 'none', background: 'transparent', padding: '4px', margin: 0, minHeight: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              {active.name}
              {onlineUsers.has(active.id) && <span style={{display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--success)'}} title="Online"></span>}
            </div>
          ) : "Select a conversation"
        } />
        <div className="message-stream">
          {(localMessages || []).map((message) => (
            <div key={message?.id || Math.random()} className={cx("message", message?.senderId === user?.id && "mine")}>
              <p>{message?.content}</p>
              <small>{message?.createdAt ? formatDate(message.createdAt, true) : ""}</small>
            </div>
          ))}
          {typingUsers.has(active?.id) && (
            <div className="message">
              <small className="muted">Typing...</small>
            </div>
          )}
          {active && !loadingMessages && (localMessages || []).length === 0 && <EmptyState text="No messages in this conversation." />}
          {active && loadingMessages && <EmptyState text="Loading messages..." />}
        </div>
        <form className="send-box" onSubmit={send}>
          <input value={content} onChange={handleType} placeholder={active ? "Type a message" : "Choose a contact first"} disabled={!active} />
          <button className="primary" disabled={!active || !content.trim()}>Send</button>
        </form>
      </div>
    </section>
  );
}
