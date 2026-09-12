import { useState } from "react";
import { supabase } from "../supabaseClient";

import "./SetUsername.css"; 


export default function SetUsername({session, onProfileCreated}) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = username.trim();
    if (!cleanName) return; 

    setLoading(true);
    setError("");

    const {data, error: insertError} = await supabase
         .from("profiles")
         .insert([{id: session.user.id, username: cleanName}])
         .select()
         .single();

    if (insertError) {
      setError(insertError.code === "23505" ? "Username taken. Please pick another." : insertError.message); 

    } else {
      onProfileCreated(data);
    }  
    
    setLoading(false); 
  };


  return(
    <main className="setUsername-container">
      <h2>Welcome aboard!</h2>
      <p className="setUsername-message">
        What should we call you?
      </p>

      <form className="setUsername-form" onSubmit={handleSubmit}>
        <input 
         className="setUsername-input"
         type="text" 
         value={username}
         placeholder="Your Name"
         maxLength={20}
         onChange={(e) => setUsername(e.target.value)}
         required
        />

        <button
         className="setUsername-btn"
         type="submit"
         disabled={loading}
         style={{cursor: loading ? "not-allowed" : "pointer"}}
        >
         {loading ? "Saving..." : "Enter Gallery"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
    </main>
  );
}