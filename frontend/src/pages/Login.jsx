import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { GoogleLogin } from '@react-oauth/google';

export default function Login({ setUser }) {
  const [isSignup, setIsSignup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); 
  const location = useLocation();
  const [inviteToken, setInviteToken] = useState(null);
  
  const [formData, setFormData] = useState({ 
    firstName: "", lastName: "", email: "", password: "" 
  });

  // --- 1. SESSION & INVITE CHECK ---
  useEffect(() => {
    const activeSession = sessionStorage.getItem("token");
    if (activeSession) {
      const userData = JSON.parse(sessionStorage.getItem("user"));
      setUser(userData);
      navigate(userData.role === 'admin' ? '/admin' : '/'); 
      return;
    }

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (token) {
      setInviteToken(token);
      setIsSignup(true); // Invite link hamesha signup par le jaye
      if (email) setFormData(prev => ({ ...prev, email }));
    }
  }, [location, navigate, setUser]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAuthComplete = (data) => {
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    navigate(data.user.role === 'admin' ? '/admin' : '/'); 
  };

  // --- 2. FORGOT PASSWORD (Backend connection needed) ---
  const handleForgotPassword = async () => {
  if (!formData.email) {
    alert("Please enter your email address first!");
    return;
  }
  setLoading(true);
  try {
    const res = await fetch(
      "http://localhost:5002/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
        }),
      }
    );
    const data = await res.json();
    alert(data.message || "If an account exists, a reset link has been sent.");
  } catch (err) {
    alert("Error sending reset email.");
  } finally {
    setLoading(false);
  }
};
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const endpoint = isSignup ? "signup" : "login";

  const payload = isSignup
    ? {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        token: inviteToken,
      }
    : {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      };

  try {
    const res = await fetch(
      `http://localhost:5002/api/auth/${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (res.ok) {
      if (isSignup) {
        alert("Account Created! Now please log in.");
        setIsSignup(false);
      } else {
        handleAuthComplete(data);
      }
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error("Auth Error:", err);
    alert("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const handleGoogleSuccess = async (resToken) => {
    try {
      const res = await fetch("http://localhost:5002/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          credential: resToken.credential, 
          inviteToken: inviteToken 
        }),
      });
      const data = await res.json();
      if (res.ok) handleAuthComplete(data);
    } catch (err) {
      console.error("Google Error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#001e2b] font-sans p-4">
      <div className="w-full py-8 flex justify-center items-center gap-2">
        <div className="w-8 h-8 bg-[#00684a] rounded-lg flex items-center justify-center font-bold text-white">O</div>
        <h1 className="text-2xl font-bold text-white tracking-tight">OpsMind AI.</h1>
      </div>

      <div className="bg-white w-full max-w-[550px] rounded-[32px] p-10 md:p-14 shadow-2xl mt-4 border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-[32px] font-bold text-[#001e2b] mb-2 tracking-tight">
            {isSignup ? "Sign up" : "Log in"}
          </h2>
          <p className="text-gray-500 font-medium text-[16px]">Experience the power of OpsMind AI</p>
        </div>

        {/* Admin Invite Badge - Important for flow clarity */}
        {inviteToken && isSignup && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
            <span className="text-xl">🛡️</span>
            <div>
              <p className="text-[10px] font-black text-[#00684a] uppercase tracking-widest">Admin Invitation</p>
              <p className="text-xs text-emerald-600 font-medium">Secure registration link active</p>
            </div>
          </div>
        )}

        <div className="mb-10 flex justify-center w-full">
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              theme="outline"
              text={isSignup ? "signup_with" : "signin_with"}
              shape="pill" 
              width="400"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignup && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name*</label>
                <input type="text" name="firstName" required placeholder="first name" className="bg-gray-50 border border-gray-200 focus:border-[#00684a] outline-none px-4 py-3 rounded-xl font-medium" onChange={handleChange} />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name*</label>
                <input type="text" name="lastName" required placeholder="last name" className="bg-gray-50 border border-gray-200 focus:border-[#00684a] outline-none px-4 py-3 rounded-xl font-medium" onChange={handleChange} />
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address*</label>
            <input type="email" name="email" required value={formData.email} placeholder="email@opsmind.ai" className="bg-gray-50 border border-gray-200 focus:border-[#00684a] outline-none px-4 py-3 rounded-xl font-medium" onChange={handleChange} />
          </div>

          <div className="flex flex-col space-y-2 relative">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Password*</label>
              {!isSignup && (
                <button type="button" onClick={handleForgotPassword} className="text-[11px] font-bold text-[#00684a] hover:underline">
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                required 
                placeholder="••••••••" 
                className="w-full bg-gray-50 border border-gray-200 focus:border-[#00684a] outline-none px-4 py-3 rounded-xl font-medium pr-12" 
                onChange={handleChange} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00684a]"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#00684a] text-white py-4 rounded-xl font-extrabold text-sm hover:bg-[#005c42] shadow-lg shadow-[#00684a]/20 transition-all active:scale-[0.98] mt-4 disabled:opacity-70">
            {loading ? "Processing..." : isSignup ? "Create your account" : "Log in to your account"}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-400 text-sm font-medium">
          {isSignup ? "Already have an account?" : "Don't have an account?"} 
          <span onClick={() => setIsSignup(!isSignup)} className="text-[#00684a] font-bold cursor-pointer hover:underline ml-1">
            {isSignup ? "Log in" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}