import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, cx } from "../utils/helpers";
import { PanelHeader, EmptyState } from "../components/ui";

export function Messages() {
  const { user, setNotice } = useOutletContext();
  const conversations = useAsync(api.conversations, []);
  const usersState = useAsync(() => api.users(), []);
  const [active, setActive] = useState(null);
  const [content, setContent] = useState("");
  const thread = useAsync(() => active ? api.conversation(active.id) : Promise.resolve({ messages: [] }), [active?.id]);

  async function send(event) {
    event.preventDefault();
    if (!active) return;
    try {
      await api.sendMessage({ receiverId: active.id, content });
      setContent("");
      setNotice("Message sent");
      conversations.refresh();
      thread.refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  const contacts = [
    ...(conversations.data || []).map((item) => item.user).filter(Boolean),
    ...(usersState.data || []).filter((item) => item.id !== user.id),
  ].filter((contact, index, list) => contact && list.findIndex((item) => item.id === contact.id) === index);

  return (
    <section className="messages-layout">
      <aside className="conversation-list">
        <PanelHeader title="Messages" />
        {contacts.length === 0 && <EmptyState text="No conversations yet. Super Admin can start one from the user list." />}
        {contacts.map((contact) => (
          <button key={contact.id} className={cx(active?.id === contact.id && "active")} onClick={() => setActive(contact)}>
            <strong>{contact.name}</strong><small>{contact.email}</small>
          </button>
        ))}
      </aside>
      <div className="thread">
        <PanelHeader title={active ? active.name : "Select a conversation"} />
        <div className="message-stream">
          {(thread.data?.messages || []).map((message) => (
            <div key={message.id} className={cx("message", message.senderId === user.id && "mine")}>
              <p>{message.content}</p>
              <small>{formatDate(message.createdAt, true)}</small>
            </div>
          ))}
          {active && !thread.loading && (thread.data?.messages || []).length === 0 && <EmptyState text="No messages in this conversation." />}
        </div>
        <form className="send-box" onSubmit={send}>
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder={active ? "Type a message" : "Choose a contact first"} disabled={!active} />
          <button className="primary" disabled={!active}>Send</button>
        </form>
      </div>
    </section>
  );
}
