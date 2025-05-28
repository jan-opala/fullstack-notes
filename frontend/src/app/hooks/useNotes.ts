import { useState, useEffect, useRef } from "react";
import axios from "axios";

type Note = {
  id: string;
  title: string;
  content: string;
};

export const useNotes = (isAuthenticated: boolean | null) => {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const userNotes = useRef<Note[] | null>(null);

  const fetchNotes = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/my-notes", {
        withCredentials: true,
      });
      console.log(userNotes.current);
      if (JSON.stringify(userNotes.current) !== JSON.stringify(res.data)){
        setNotes(res.data || []);
        console.log("set");
        userNotes.current = res.data || [];
      }
    } catch {
      setNotes([]);
      userNotes.current = [];
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotes();
  }, [isAuthenticated]);

  return { notes, refreshNotes: fetchNotes, userNotes: userNotes.current };
};