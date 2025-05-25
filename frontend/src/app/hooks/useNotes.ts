import { useState, useEffect } from "react";
import axios from "axios";

type Note = {
  id: string;
  title: string;
  content: string;
};

export const useNotes = (isAuthenticated: boolean | null) => {
  const [notes, setNotes] = useState<Note[] | null>(null); // Use the Note type

  const fetchNotes = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/my-notes", {
        withCredentials: true,
      });
      setNotes(Array.isArray(res.data) ? res.data : res.data.notes || []); // Ensure res.data matches the Note[] type
    } catch {
      setNotes([]);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return; // Only fetch if authenticated
    fetchNotes();
  }, [isAuthenticated]);

  return { notes, refreshNotes: fetchNotes };
};