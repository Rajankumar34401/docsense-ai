import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'; 
import remarkGfm from 'remark-gfm'; 

export default function UserChat({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sourceData, setSourceData] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false); 
  const [sidebarMenuId, setSidebarMenuId] = useState(null); 
  const [currentChatId, setCurrentChatId] = useState(null); 
  const [recentChats, setRecentChats] = useState([]); 
  const chatEnd = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  // --- SESSION STORAGE AUTH HELPER ---
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${sessionStorage.getItem('token')}`
  });

  useEffect(() => {
    const closeMenus = () => { setShowMenu(false); setSidebarMenuId(null); };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  const fetchRecent = async () => {
    try {
      const res = await fetch(`http://localhost:5002/api/chats/recent/${user?.id || 'guest_user'}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setRecentChats(data);
    } catch (err) { console.error("Fetch Recent Error:", err); }
  };

  useEffect(() => { fetchRecent(); }, [messages, user]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleRename = async (id, e) => {
    e?.stopPropagation();
    const targetId = id || currentChatId;
    if (!targetId) return;

    const currentTitle = recentChats.find(c => c._id === targetId)?.title || "";
    const newTitle = prompt("Rename chat to:", currentTitle);
    
    if (newTitle) {
      try {
        await fetch(`http://localhost:5002/api/chats/rename/${targetId}`, {
          method: "PUT", 
          headers: getAuthHeaders(),
          body: JSON.stringify({ title: newTitle })
        });
        fetchRecent();
      } catch (err) { console.error("Rename Error:", err); }
    }
    setSidebarMenuId(null);
    setIsHeaderMenuOpen(false);
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    const targetId = id || currentChatId;
    if (!targetId) return;

    if (window.confirm("Delete this chat permanently?")) {
      try {
        await fetch(`http://localhost:5002/api/chats/delete/${targetId}`, { 
          method: "DELETE",
          headers: getAuthHeaders()
        });
        if (targetId === currentChatId) startNewChat();
        fetchRecent();
      } catch (err) { console.error("Delete Error:", err); }
    }
    setSidebarMenuId(null);
    setIsHeaderMenuOpen(false);
  };

  const loadChat = async (id) => {
    try {
      const res = await fetch(`http://localhost:5002/api/chats/${id}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setMessages(data.messages || []);
      setCurrentChatId(data._id);
    } catch (err) { console.error("Load Chat Error:", err); }
  };

  const startNewChat = () => {
    setMessages([]);
    setSourceData(null);
    setCurrentChatId(null);
  };

  const ask = async () => {
    if (!input.trim() || isTyping) return;

    const query = input;
    const userMsg = { role: 'user', content: query };
    
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: "", source: null }]);
    setInput("");
    setIsTyping(true);

    try {
      // 1. Save User Message
      const saveRes = await fetch("http://localhost:5002/api/chats/save", {
        method: "POST", 
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: user?.id || "guest_user", chatId: currentChatId, message: userMsg })
      });
      const savedData = await saveRes.json();
      const actualChatId = currentChatId || savedData._id;
      if (!currentChatId) setCurrentChatId(actualChatId);

      // 2. Get AI Streamed Response
      const response = await fetch("http://localhost:5002/api/sops/ask", {
        method: "POST", 
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          question: query, 
          history: messages.slice(-4),
          userName: user?.name || "User" ,
          userRole: user?.role || "employee"
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let finalSource = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              
              if (data.text) {
                accumulatedText += data.text;
                const cleanDisplay = accumulatedText.replace("SOURCE_FOUND", "").trim();
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = cleanDisplay;
                  return newMsgs;
                });
              }

              if (data.sourceName) {
                finalSource = { name: data.sourceName, snippet: data.sourceSnippet };
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].source = finalSource;
                  return newMsgs;
                });
              }
            } catch (e) { /* chunk handle */ }
          }
        }
      }

      // 3. Save Assistant Final Message
      await fetch("http://localhost:5002/api/chats/save", {
        method: "POST", 
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          userId: user?.id || "guest_user", 
          chatId: actualChatId, 
          message: { role: 'assistant', content: accumulatedText.replace("SOURCE_FOUND", ""), source: finalSource } 
        })
      });

    } catch (err) { 
      console.error("Chat Error:", err); 
    } finally { 
      setIsTyping(false); 
      fetchRecent(); 
    }
  };

  const handleLogoutWithSession = () => {
    sessionStorage.removeItem('token'); // Clear token
    onLogout(); // App.js wala logout logic
  };

  return (
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <div className={`${isCollapsed ? 'w-[75px]' : 'w-[280px]'} bg-[#f0f4f9] flex flex-col h-full hidden lg:flex relative transition-all duration-300 border-r border-gray-200`}>
        <div className="p-4 pt-6">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-3 hover:bg-gray-200 rounded-full transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#5f6368"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </button>
        </div>

        <div className="px-4 mb-6">
          <button onClick={startNewChat} className={`flex items-center gap-3 bg-[#dde3ea] rounded-full font-medium hover:bg-[#d2d8e1] transition-all shadow-sm ${isCollapsed ? 'p-3 w-12 h-12 justify-center' : 'p-4 px-5 text-[15px]'}`}>
            <span className="text-2xl font-light text-gray-600">+</span>
            {!isCollapsed && <span className="text-gray-700">New chat</span>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
          {!isCollapsed && <p className="text-[13px] font-bold px-4 text-gray-500 uppercase tracking-widest mb-3">Recent</p>}
          <div className="flex flex-col gap-0.5"> 
            {recentChats.map((chat) => (
              <div 
                key={chat._id} 
                className={`group relative flex items-center cursor-pointer transition-all rounded-full ${isCollapsed ? 'justify-center p-3' : 'px-4 py-2'} ${currentChatId === chat._id ? 'bg-[#d3e3fd] text-[#041e49]' : 'text-[#444746] hover:bg-[#e1e5e9]'}`}
              >
                {!isCollapsed && (
                  <>
                    <span onClick={() => loadChat(chat._id)} className={`truncate flex-1 text-[15px] ${currentChatId === chat._id ? 'font-semibold' : 'font-medium'} tracking-tight`}>
                      {chat.title}
                    </span>
                    <div className="relative flex items-center">
                      <button onClick={(e) => { e.stopPropagation(); setSidebarMenuId(sidebarMenuId === chat._id ? null : chat._id); }} className={`p-1 rounded-full transition-all hover:bg-black/5 ${sidebarMenuId === chat._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                      </button>
                      {sidebarMenuId === chat._id && (
                        <div className="fixed translate-x-10 -translate-y-2 w-48 bg-white shadow-2xl rounded-2xl border border-gray-100 z-[9999] py-2">
                          <button onClick={(e) => handleRename(chat._id, e)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-700">✎ Rename</button>
                          <button onClick={(e) => handleDelete(chat._id, e)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-red-500 text-sm font-medium">🗑 Delete</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-gray-200/50 flex flex-col gap-2">
          {isAdmin && (
            <button onClick={() => navigate('/admin')} className={`flex items-center gap-3 bg-indigo-50 text-indigo-600 rounded-full font-bold hover:bg-indigo-100 transition-all ${isCollapsed ? 'p-3 justify-center' : 'p-3 px-5 text-[14px] w-full'}`}>
              <span>📊</span> {!isCollapsed && <span>Admin Logs</span>}
            </button>
          )}
          <div onClick={handleLogoutWithSession} className={`flex items-center gap-3 hover:bg-red-50 rounded-full cursor-pointer text-red-500 font-bold transition-all ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3 text-[14px]'}`}>
            <span>🚪</span> {!isCollapsed && <span>Logout</span>}
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col relative overflow-hidden ${messages.length === 0 ? 'bg-[#f8fafd]' : 'bg-white'}`}>
        <header className={`h-16 flex items-center justify-between px-6 sticky top-0 z-50 transition-all ${messages.length === 0 ? 'bg-transparent' : 'bg-white/80 backdrop-blur-md'}`}>
          <div className="flex-none text-lg font-medium text-gray-400 select-none">OpsMind AI</div>
          <div className="absolute left-1/2 -translate-x-1/2">
            {messages.length > 0 && (
              <div className="relative group">
                <button onClick={(e) => { e.stopPropagation(); setIsHeaderMenuOpen(!isHeaderMenuOpen); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all border border-transparent active:scale-95 ${isHeaderMenuOpen ? 'bg-[#f0f4f9]' : 'bg-transparent hover:bg-[#f0f4f9]'}`}>
                  <span className="text-sm font-medium text-[#1f1f1f] truncate max-w-[150px] lg:max-w-[350px]">
                    {currentChatId ? recentChats.find(c => c._id === currentChatId)?.title : "OpsMind AI"}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                {isHeaderMenuOpen && currentChatId && (
                  <div className="absolute top-full mt-2 left-0 w-52 bg-white shadow-2xl rounded-2xl border border-gray-100 py-2 z-[9999] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleRename()} className="w-full flex items-center gap-4 px-5 py-3 text-sm text-gray-700 hover:bg-[#f0f4f9] border-b border-gray-50">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      <span className="font-medium">Rename</span>
                    </button>
                    <button onClick={() => handleDelete()} className="w-full flex items-center gap-4 px-5 py-3 text-sm text-red-500 hover:bg-red-50">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      <span className="font-medium">Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#001e2b] rounded-full flex items-center justify-center text-white font-bold text-[10px]">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto px-6 ${messages.length === 0 ? 'hidden' : 'block'}`}>
          <div className="max-w-3xl mx-auto py-8 space-y-6 pb-48"> 
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-3xl ${m.role === 'user' ? 'bg-[#f0f4f9] max-w-[85%] px-6' : 'w-full'}`}>
                  {m.role === 'assistant' && <div className="text-[#4285f4] mb-2 text-xl">✦</div>}
                  <div className="prose prose-base max-w-none text-[#1f1f1f] leading-relaxed [&>p]:text-[18px] [&>ul]:text-[18px] [&>ol]:text-[18px] [&>p]:mb-2 [&>p]:font-normal"> 
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                  {m.source && (
                    <button onClick={() => setSourceData(m.source)} className="mt-4 flex items-center gap-2 text-[11px] font-bold text-blue-600 bg-blue-50 px-5 py-2 rounded-full border border-blue-100">
                      📄 VIEW SOURCE: {m.source.name}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>
        </div>

        <div className={`flex flex-col items-center justify-center px-4 ${messages.length === 0 ? 'flex-1' : 'h-auto py-8 bg-white'}`}>
          {messages.length === 0 && (
            <div className="max-w-3xl w-full mb-12">
              <h1 className="text-[56px] font-medium leading-tight">
                <span className="bg-gradient-to-r from-[#4285f4] to-[#d96570] bg-clip-text text-transparent">Hi {user?.name?.split(' ')[0] || "User"}</span>
              </h1>
              <p className="text-[56px] text-[#c4c7c5] font-medium">How can I help you today?</p>
            </div>
          )}
          <div className="max-w-3xl w-full relative">
            <div className="flex items-center bg-[#f0f4f9] rounded-[28px] px-6 py-2 border border-transparent shadow-sm">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && ask()} className="flex-1 bg-transparent border-none outline-none text-gray-800 py-3 text-[17px]" placeholder="Ask OpsMind AI..." />
              <button onClick={() => ask()} disabled={isTyping} className="ml-2">
                {isTyping ? <div className="animate-spin text-xl">◌</div> : <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SOURCE PANEL */}
      {sourceData && (
        <div className="w-[420px] bg-white border-l border-gray-100 p-8 shadow-2xl z-[200] overflow-y-auto h-full">
          <div className="flex justify-between items-center mb-8 pb-4 border-b">
            <h3 className="font-bold text-[#1f1f1f] text-sm uppercase">Source Document</h3>
            <button onClick={() => setSourceData(null)} className="text-gray-400 hover:text-black">✕</button>
          </div>
          <div className="bg-[#fff8f1] p-6 rounded-[32px] border border-orange-100">
            <p className="text-orange-700 font-bold text-xs mb-4 uppercase">📜 {sourceData.name}</p>
            <p className="text-[15px] leading-relaxed text-[#444746] italic font-serif">"{sourceData.snippet || 'Referenced from document content.'}"</p>
          </div>
        </div>
      )}
    </div>
  );
}