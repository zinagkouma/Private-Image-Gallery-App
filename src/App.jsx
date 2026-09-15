import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

import Auth from "./components/Auth";
import SetUsername from "./components/SetUsername"; 
import Gallery  from "./components/Gallery"; 

import "./App.css"; 


export default function App() {
  const [session, setSession] = useState(null); 
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  //Fetch or check profile existence
  const loadUserProfile = async (userId) => {
    const {data} = await supabase
         .from("profiles")
         .select("username")
         .eq("id", userId)
         .maybeSingle();

    setProfile(data || null);
    setLoading(false);      
  };

  useEffect(() => {
    //Auth state listener fires automatically on mount and evaluates the session
    const {data: {subscription}} = supabase.auth.onAuthStateChange(async(_event, session) => {
      setSession(session);

      if (session) {
        await loadUserProfile(session.user.id);

      } else {
        setProfile(null);
        setLoading(false); 
      }
    });

    return () => subscription.unsubscribe(); 
  }, []); 


  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Περίμενε...</p>
      </div>
    );
  }
  
  //Render according to case: 
  //1. First visit (no username yet)
  if (session && !profile) {
    return <SetUsername session={session} onProfileCreated={(newProf) => setProfile(newProf)}/>
  }

  //2. Signed in and username exists
  if (session && profile) {
    return <Gallery session={session} profile={profile}/>;
  }

  //3. If session is expired, show email form
  return <Auth/>; 
  
}