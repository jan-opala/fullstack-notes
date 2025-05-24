'use client'
import { useState, useEffect } from 'react';
import axios from "axios";
import { useAuth } from "../hooks/checkAuth";
import { getNotes } from "../hooks/getNotes";
import { redirect } from 'next/navigation';

export default function Notes() {
  const [loggingIn, setLoggingIn] = useState(false);
  const { isAuthenticated } = useAuth();
  const { notes } = getNotes();

  if (isAuthenticated === null) return null; // Wait for auth check (and cookie)
  if (!isAuthenticated) {
    redirect("/login");
    return null;
  }

const listNotes = notes.map(note => (
  <div key={note.id}>
    <li>{note.title}</li>
    <li> - {note.content}</li>
  </div>
));

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     const getNotes = async () => {
  //       try {
  //         const res = await axios.get("http://localhost:8000/api/my-notes", {
  //           withCredentials: true,
  //         });
  //         console.log(res);
  //         setNotes(res);
  //       } catch (err: any) {
  //         setNotes({});
  //       }
  //     };
  //     getNotes();
  //   }
  // }, [isAuthenticated]);

  return (
    <div>
        
        <h1>Notatki</h1>
        {/* https://react.dev/learn/rendering-lists */}
        <button onClick={() => {
          console.log(notes)
        }}>test</button>
        <ul>{listNotes}</ul>
 
    </div>
  );
}
