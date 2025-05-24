'use client'
import { useState, useEffect } from 'react';
import axios from "axios";
import { useAuth } from "../hooks/checkAuth";
import { redirect } from 'next/navigation';

export default function Notes() {
  const [loggingIn, setLoggingIn] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const getNotes = async () => {
        try {
          const res = await axios.get("http://localhost:8000/api/my-notes", {
            withCredentials: true,
          });
          console.log(res);
        } catch (err: any) {
          console.log(err);
        }
      };
      getNotes();
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) return null; // Wait for auth check (and cookie)
  if (!isAuthenticated) {
    redirect("/login");
    return null;
  }

  return (
    <div>
        
        <h1>Notatki</h1>
 
    </div>
  );
}
