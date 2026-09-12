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
         .select('*')
         .eq("id", userId)
         .maybeSingle();

    setProfile(data || null);
    setLoading(false);      
  };

  useEffect(() => {
    //Initial session check
    supabase.auth.getSession().then(({data: {session}}) => {
      setSession(session); 

      if (session) {
        loadUserProfile(session.user.id);

      } else {
        setLoading(false); 
      }
    });

    //Auth state listener that is triggered upon email link click
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        loadUserProfile(session.user.id);

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
        <p>Loading gallery...</p>
      </div>
    );
  }
  

  //Render according to case: 
  //1. Not signed in 
  if (!session) {
    return <Auth/>;
  }

  //2. First visit (no username yet)
  if (!profile) {
    return <SetUsername session={session} onProfileCreated={(newProf) => setProfile(newProf)}/>;
  }

  //3. Signed in and username exists
  return <Gallery session={session} profile={profile}/>; 
  
}