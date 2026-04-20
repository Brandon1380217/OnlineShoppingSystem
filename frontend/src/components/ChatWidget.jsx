import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Zap, Store } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ChatWidget({ shop, autoOpen = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const autoOpenedRef = useRef(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [presets, setPresets] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  const pollRef = useRef(null);
  const scrollRef = useRef(null);
  const lastIdRef = useRef(0);

  const loadMessages = useCallback(async (convId, initial = false) => {
    try {
      const since = initial ? null : lastIdRef.current;
      const data = await api.chats.messages(convId, since);
      if (initial) {
        setMessages(data.messages);
      } else if (data.messages.length > 0) {
        setMessages(prev => [...prev, ...data.messages]);
      }
      if (data.messages.length > 0) {
        lastIdRef.current = data.messages[data.messages.length - 1].id;
      }
    } catch { /* ignore */ }
  }, []);

  const openChat = async () => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'business' && user.id === shop.id) {
      alert("You can't chat with your own shop.");
      return;
    }
    setOpen(true);
    if (conversation) return;
    setLoading(true);
    try {
      const [presetData, convData] = await Promise.all([
        api.chats.presets(),
        api.chats.openWithShop(shop.id),
      ]);
      setPresets(presetData.presets);
      setConversation(convData.conversation);
      lastIdRef.current = 0;
      await loadMessages(convData.conversation.id, true);
    } catch (err) {
      alert(err.message);
      setOpen(false);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!open || !conversation) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(() => loadMessages(conversation.id), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [open, conversation, loadMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) setShowPresets(false);
  }, [messages.length]);

  useEffect(() => {
    if (autoOpen && !autoOpenedRef.current && user && shop?.id && !(user.role === 'business' && user.id === shop.id)) {
      autoOpenedRef.current = true;
      openChat();
    }
  }, [autoOpen, user, shop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (text) => {
    const body = (text ?? input).trim();
    if (!body || !conversation || sending) return;
    setSending(true);
    try {
      const msg = await api.chats.sendMessage(conversation.id, body);
      setMessages(prev => [...prev, msg]);
      lastIdRef.current = Math.max(lastIdRef.current, msg.id);
      setInput('');
      setShowPresets(false);
    } catch (err) { alert(err.message); }
    finally { setSending(false); }
  };

  const shopName = shop.company_name || `${shop.first_name}'s Shop`;
  const hidden = user?.role === 'business' && user.id === shop.id;
  if (hidden) return null;

  return (
    <>
      {!open && (
        <button onClick={openChat}
          className="fixed bottom-6 right-6 z-40 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-xl p-4 flex items-center gap-2 transition-all hover:scale-105">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:block">Chat with shop</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-[380px] h-[560px] max-h-[80vh] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{shopName}</p>
              <p className="text-xs text-brand-100 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Online - usually replies within minutes
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading ? (
              <p className="text-center text-sm text-gray-400 py-8">Loading...</p>
            ) : messages.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex w-14 h-14 rounded-full bg-brand-100 items-center justify-center mb-3">
                  <MessageCircle className="w-7 h-7 text-brand-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Start the conversation!</p>
                <p className="text-xs text-gray-500 mt-1">Ask us anything about products, shipping, or orders.</p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id}
                  className={`flex ${m.sender_role === 'customer' && user?.role === 'customer' ? 'justify-end' :
                    m.sender_role === 'business' && (user?.role === 'business' || user?.role === 'admin') ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                    (m.sender_role === 'customer' && user?.role === 'customer') ||
                    (m.sender_role === 'business' && (user?.role === 'business' || user?.role === 'admin'))
                      ? 'bg-brand-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    <p className={`text-[10px] mt-1 ${
                      (m.sender_role === 'customer' && user?.role === 'customer') ||
                      (m.sender_role === 'business' && (user?.role === 'business' || user?.role === 'admin'))
                        ? 'text-brand-100' : 'text-gray-400'
                    }`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {showPresets && presets.length > 0 && conversation && (
            <div className="border-t border-gray-100 bg-white p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-brand-600" />
                <p className="text-xs font-semibold text-gray-700">Quick questions</p>
                <button onClick={() => setShowPresets(false)} className="ml-auto text-xs text-gray-400 hover:text-gray-600">Hide</button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {presets.map((q, i) => (
                  <button key={i} onClick={() => send(q)} disabled={sending}
                    className="text-xs px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-full transition-colors border border-brand-100">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t border-gray-200 bg-white p-3 flex items-center gap-2">
            {!showPresets && presets.length > 0 && (
              <button type="button" onClick={() => setShowPresets(true)}
                className="shrink-0 p-2 text-brand-600 hover:bg-brand-50 rounded-full" title="Quick questions">
                <Zap className="w-4 h-4" />
              </button>
            )}
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..." disabled={!conversation || sending}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            <button type="submit" disabled={!input.trim() || !conversation || sending}
              className="shrink-0 p-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white rounded-full transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
