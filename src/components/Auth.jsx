import { useState } from "react";
import { supabase } from "../supabaseClient";

import "./Auth.css";

export default function Auth() {
  const [email, setEmail] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [status, setStatus] = useState({type: "", text: ""});   

  const handleSendLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({type: "", text: ""}); 

    const {error} = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin
      }    
    });

    if (error) {
      setStatus({type: "error", text: error.message}); 

    } else {
      setStatus({type: "success", text: "Link sent to your email!"}); 
    }

    setLoading(false); 
  }; 

  return(
    <main className="auth-container">
      <h2>Preveza 2026 Highlights</h2>   
      <p className="auth-prompt">
        Enter your email to receive your access link.
      </p>

      <form className="auth-form" onSubmit={handleSendLink}>
        <input 
         className="auth-input"
         type="email"
         value={email}
         placeholder="Your Email"
         onChange={(e) => setEmail(e.target.value)}
         required
        />
  
        <button
         className="submit-btn"
         type="submit"
         disabled={loading}
         style={{cursor: loading ? "not-allowed" : "pointer"}}
        >
         {loading ? "Sending Link" : "Send Link"}
        </button>
      </form>

      {status.text && (
        <p style={{color: status.type === "error" ? "#ef4444" : "#16a34a", marginTop: '16px', fontSize: '14px'}}>
          {status.text}
        </p>
      )}
    </main>
  );
}