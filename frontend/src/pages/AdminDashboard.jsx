import { useState, useEffect } from 'react';

export default function AdminDashboard({ user, logout }) {
  const [docs, setDocs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [view, setView] = useState('library'); 
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('employee');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Invite System States
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // 1. Fetch Admins (Changed to sessionStorage)
  const fetchAdmins = async () => {
    try {
      const res = await fetch("http://localhost:5002/api/auth/all-admins", {
        headers: { "Authorization": `Bearer ${sessionStorage.getItem('token')}` } // ✅ Changed
      });
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error("Admins Fetch Error:", err); 
      if(err.status === 403) showToast("Access Denied to Admin List", "error");
    }
  };

  // 2. Toggle Permission (Changed to sessionStorage)
  const toggleInviteAccess = async (adminId, newStatus) => {
    try {
      const res = await fetch(
        `http://localhost:5002/api/auth/toggle-access/${adminId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("token")}`, // ✅ Changed
          },
          body: JSON.stringify({ canInvite: newStatus }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        showToast("Access Updated!");

        if (adminId === user.id) {
          showToast("Permission changed. Please login again.", "error");
          setTimeout(() => {
            sessionStorage.removeItem("token"); // ✅ Changed
            sessionStorage.removeItem("user");  // Safer to clear user too
            logout(); 
          }, 1500);
          return;
        }

        fetchAdmins();
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch (err) {
      showToast("Server Error", "error");
    }
  };

  // 3. Remove Admin (Changed to sessionStorage)
  const handleRemoveAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to remove ${adminName}?`)) return;
    try {
      const res = await fetch(`http://localhost:5002/api/auth/remove-admin/${adminId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${sessionStorage.getItem('token')}` } // ✅ Changed
      });
      if (res.ok) {
        showToast("Admin Removed");
        fetchAdmins();
      } else {
        const data = await res.json();
        showToast(data.message || "Remove failed", "error");
      }
    } catch (err) { showToast("Server Error", "error"); }
  };

  // Baaki functions same hain
  const fetchDocs = async () => {
    try {
      const res = await fetch("http://localhost:5002/api/sops/list");
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) { console.error("Docs Error:", err); setLoading(false); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:5002/api/sops/admin/logs"); 
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Logs Error:", err); }
  };

  useEffect(() => {
    fetchDocs();
    fetchLogs();
    fetchAdmins();
  }, []);

  const calculateAccuracy = () => {
    if (logs.length === 0) return 100;
    const successfulQueries = logs.filter(log => log.hasSource !== false).length;
    return Math.round((successfulQueries / logs.length) * 100);
  };

  const accuracy = calculateAccuracy();
  const strokeOffset = 502 - (502 * accuracy) / 100;

  const handleInvite = async () => {
    if (!inviteEmail) return showToast("Email zaroori hai!", "error");
    setIsInviting(true);
    try {
      const res = await fetch("http://localhost:5002/api/auth/invite", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionStorage.getItem('token')}` // ✅ Changed
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedLink(data.inviteLink);
        showToast("Invite Link Sent to Email!");
      } else {
        showToast(data.message || "Invite failed", "error");
      }
    } catch (err) { showToast("Server Error", "error"); }
    finally { setIsInviting(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", selectedRole);
    setUploading(true);
    try {
      // 💡 Tip: Agar upload API ko bhi auth chahiye, toh yahan headers mein token add karein
      const res = await fetch("http://localhost:5002/api/sops/upload", { 
        method: "POST", 
        body: formData 
      });
      if (res.ok) { showToast("SOP Uploaded!"); fetchDocs(); }
    } catch (err) { showToast("Upload failed", "error"); }
    finally { setUploading(false); }
  };

  const executeDelete = async (name) => {
    try {
      const res = await fetch(`http://localhost:5002/api/sops/${name}`, { method: "DELETE" });
      if (res.ok) {
        showToast("File deleted", "success");
        setConfirmDeleteId(null);
        fetchDocs();
      }
    } catch (err) { showToast("Delete failed", "error"); }
  };

  const filteredDocs = Array.isArray(docs) ? docs.filter(doc => 
    (doc.filename || doc).toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-gray-800 font-sans overflow-hidden">
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-2xl shadow-xl text-white font-bold animate-bounce ${toast.type === 'success' ? 'bg-[#4f46e5]' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-72 bg-[#f0f4f9] flex flex-col p-6 border-r border-gray-100 shrink-0">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-[#4f46e5] rounded-xl flex items-center justify-center text-white text-xl font-bold">O</div>
          <span className="text-2xl font-bold text-[#1e293b]">OpsMind</span>
        </div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setView('library')} className={`w-full p-4 rounded-2xl font-bold flex items-center gap-3 transition-all ${view === 'library' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
            📂 SOP Library
          </button>
          <button onClick={() => setView('logs')} className={`w-full p-4 rounded-2xl font-bold flex items-center gap-3 transition-all ${view === 'logs' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
            👥 Activity Logs
          </button>
          <button onClick={() => setView('admins')} className={`w-full p-4 rounded-2xl font-bold flex items-center gap-3 transition-all ${view === 'admins' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
            🛡️ Manage Admins
          </button>
        </nav>
        <button onClick={logout} className="p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl mt-auto italic">
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white p-12">
        <div className="max-w-[1500px] mx-auto">
          <header className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-bold">
              {view === 'library' ? 'Knowledge Base' : view === 'logs' ? 'User Activity Logs' : 'Admin Control Panel'}
            </h1>
            <div className="bg-[#f0fdf4] text-[#16a34a] px-5 py-2 rounded-full text-xs font-bold border border-[#dcfce7]">● System Online</div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-3 space-y-10">
              
              {/* VIEW 1: SOP LIBRARY */}
              {view === 'library' && (
                <>
                  <div className="grid grid-cols-3 gap-8 text-center">
                    <div className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-3">Total SOPs</p>
                      <h3 className="text-4xl font-black">{docs.length}</h3>
                    </div>
                    <div className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-3">Total Logs</p>
                      <h3 className="text-4xl font-black">{logs.length}</h3>
                    </div>
                    <div className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Mode</p>
                      <span className="bg-[#4f46e5] text-white px-6 py-2 rounded-xl text-[10px] font-bold">ADMIN</span>
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input type="text" placeholder="Search by filename..." className="w-full bg-[#f8fafc] border-2 border-transparent rounded-[24px] py-6 pl-16 pr-8 outline-none focus:bg-white focus:border-indigo-100 transition-all text-lg shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>

                  <div className="bg-[#f8fafc] border-2 border-dashed border-[#e2e8f0] rounded-[48px] p-20 text-center">
                    <label className="cursor-pointer bg-[#4f46e5] text-white px-16 py-5 rounded-[24px] font-black shadow-lg hover:scale-105 transition-all inline-block text-xl">
                      <input type="file" className="hidden" onChange={handleUpload} />
                      {uploading ? 'Processing...' : '+ Upload New SOP'}
                    </label>
                  </div>

                  <div className="space-y-4 pb-10">
                    {filteredDocs.map((doc, i) => (
                      <div key={i} className="bg-white rounded-[28px] p-7 flex items-center justify-between group border border-gray-100 shadow-sm hover:border-indigo-50">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-[#f8fafc] rounded-2xl flex items-center justify-center text-3xl">📄</div>
                          <span className="text-[#1e293b] font-bold text-xl">{doc.filename || doc}</span>
                        </div>
                        {confirmDeleteId === (doc.filename || doc) ? (
                          <div className="flex gap-2">
                            <button onClick={() => executeDelete(doc.filename || doc)} className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">CONFIRM</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold">CANCEL</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(doc.filename || doc)} className="opacity-0 group-hover:opacity-100 text-red-500 font-bold bg-white px-8 py-3 rounded-2xl border border-red-50 hover:bg-red-50 transition-all text-sm">Delete SOP</button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* VIEW 2: ACTIVITY LOGS */}
              {view === 'logs' && (
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
                  <table className="w-full text-left">
                    <thead className="bg-[#f8fafc] text-[10px] uppercase text-gray-400 font-black tracking-widest border-b">
                      <tr><th className="p-8">User</th><th className="p-8">Question</th><th className="p-8 text-right">Time</th></tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {logs.map((log, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-all">
                          <td className="p-8 font-bold text-[#4f46e5]">{log.userName}</td>
                          <td className="p-8 italic text-gray-600">"{log.question}"</td>
                          <td className="p-8 text-right text-gray-400 font-medium">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VIEW 3: MANAGE ADMINS */}
              {view === 'admins' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-white rounded-[40px] p-12 border border-gray-100 shadow-sm">
                    <h2 className="text-2xl font-black mb-2">Invite New Admin</h2>
                    <p className="text-gray-400 mb-10 text-sm">Create a secure registration link for new administrators.</p>
                    <div className="flex gap-4 mb-6">
                      <input type="email" placeholder="Enter email address..." className="flex-1 bg-[#f8fafc] border-2 border-transparent rounded-[24px] py-6 px-8 outline-none focus:bg-white focus:border-indigo-100 transition-all text-lg shadow-sm" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                      <button onClick={handleInvite} disabled={isInviting} className="bg-[#4f46e5] text-white px-12 py-6 rounded-[24px] font-black shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                        {isInviting ? 'Generating...' : 'Invite'}
                      </button>
                    </div>
                    {generatedLink && (
                      <div className="bg-[#f0f4f9] p-8 rounded-[32px] border border-dashed border-indigo-200">
                        <p className="text-[10px] font-black text-[#4f46e5] uppercase mb-4 tracking-widest text-center">Admin Registration Link</p>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100">
                          <code className="flex-1 text-xs text-gray-600 break-all">{generatedLink}</code>
                          <button onClick={() => { navigator.clipboard.writeText(generatedLink); showToast("Copied!"); }} className="bg-indigo-50 text-[#4f46e5] px-6 py-3 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all">Copy</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden mt-8">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                      <h2 className="text-xl font-black text-gray-800">Admin Management</h2>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full font-black tracking-widest">MASTER CONTROL</span>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b">
                        <tr>
                          <th className="px-8 py-5">Admin Name</th>
                          <th className="px-8 py-5">Email</th>
                          <th className="px-8 py-5">Invite Access</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {admins.map((adm) => (
                          <tr key={adm._id} className="hover:bg-gray-50/50 transition-all">
                            <td className="px-8 py-6 font-bold text-gray-700">{adm.name || "Pending..."}</td>
                            <td className="px-8 py-6 text-gray-500">{adm.email}</td>
                            <td className="px-8 py-6">
                              <button 
                                onClick={() => !adm.isHead && toggleInviteAccess(adm._id, !adm.canInvite)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all border ${
                                  adm.isHead || adm.canInvite 
                                  ? 'bg-green-100 text-green-700 border-green-200 shadow-sm' 
                                  : 'bg-gray-100 text-gray-400 border-transparent'
                                } ${adm.isHead ? 'cursor-default' : 'cursor-pointer'}`}
                              >
                                {adm.isHead || adm.canInvite ? '✓ FULL ACCESS' : 'LIMITED ACCESS'}
                              </button>
                            </td>
                            <td className="px-8 py-6 text-right">
                              {!adm.isHead ? (
                                <button 
                                  onClick={() => handleRemoveAdmin(adm._id, adm.name)}
                                  className="text-red-400 hover:text-red-600 font-bold text-xs uppercase tracking-widest"
                                >
                                  Remove
                                </button>
                              ) : (
                                <span className="text-indigo-600 font-black text-[10px] tracking-widest uppercase bg-indigo-50 px-3 py-1 rounded-md">
                                  Master
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR: AI PERFORMANCE */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm sticky top-10">
                <div className="mb-10 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">AI Accuracy Index</p>
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-44 h-44 -rotate-90">
                      <circle cx="88" cy="88" r="80" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                      <circle 
                        cx="88" cy="88" r="80" fill="none" 
                        stroke="#4f46e5" strokeWidth="14" 
                        strokeDasharray="502" 
                        strokeDashoffset={strokeOffset} 
                        strokeLinecap="round" 
                        className="transition-all duration-1000" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-gray-900">{accuracy}%</span>
                    </div>
                  </div>
                </div>
                <hr className="border-gray-50 mb-8" />
                <h3 className="text-xs font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Live Activity
                </h3>
                <div className="space-y-4">
                  {logs.slice(0, 3).map((log, i) => (
                    <div key={i} className="bg-[#f8fafc] p-4 rounded-2xl text-[11px] text-gray-500 italic border border-gray-50">"{log.question}"</div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}