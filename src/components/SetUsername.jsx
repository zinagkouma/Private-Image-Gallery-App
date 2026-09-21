import { useState } from "react";
import { supabase } from "../supabaseClient";

import "./SetUsername.css"; 


const isValidPasscode = (code) => {
  const match = code.trim().match(/^SAT-([1-9]|1[0-2])$/);
  return Boolean(match); 
};

export default function SetUsername({session, onProfileCreated}) {
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = username.trim();
    const cleanPasscode = passcode.trim();

    if (!cleanName) return; 

    if (!isValidPasscode(cleanPasscode)) {
      setError("Invalid passcode.");
      return; 
    } 

    setLoading(true);
    setError("");

    const {data, error: insertError} = await supabase
         .from("profiles")
         .insert([{id: session.user.id, username: cleanName, passcode: cleanPasscode}])
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
      <h2>Καλώς όρισες!</h2>
      <p className="setUsername-message">
        Εισήγαγε το όνομά σου και το συνθηματικό για να συνδεθείς.
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

        <input 
         className="setUsername-input"
         type="text"
         value={passcode}
         placeholder="Συνθηματικό"
         onChange={(e) => setPasscode(e.target.value)}
         required
        />

        <button
         className="setUsername-btn"
         type="submit"
         disabled={loading}
         style={{cursor: loading ? "not-allowed" : "pointer"}}
        >
         {loading ? "Αποθήκευση..." : "Μπες στην συλλογή"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
    </main>
  );
}