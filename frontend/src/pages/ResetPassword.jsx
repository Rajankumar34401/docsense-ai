import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // URL se token nikalna
    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    const handleReset = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return alert("Passwords match nahi ho rahe!");

        setLoading(true);
        try {
            const res = await fetch(http://localhost:5002/api/auth/reset-password, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Password badal gaya! Ab login karein.");
                navigate('/login');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Kuch galat hua!");
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#001e2b] p-4">
            <div className="bg-white p-10 rounded-[32px] w-full max-w-[450px]">
                <h2 className="text-2xl font-bold mb-6 text-center">Naya Password Set Karein</h2>
                <form onSubmit={handleReset} className="space-y-4">
                    <input 
                        type="password" 
                        placeholder="New Password" 
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#00684a]"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Confirm Password" 
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#00684a]"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button 
                        className="w-full bg-[#00684a] text-white py-3 rounded-xl font-bold"
                        disabled={loading}
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}