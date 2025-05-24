import { useState, useEffect } from "react";
import { useAuth } from './checkAuth'
import axios from "axios";

export const getNotes = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotes = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/my-notes", {
          withCredentials: true,
        });
        setNotes(Array.isArray(res.data) ? res.data : res.data.notes || []);
      } catch {
        setNotes([]);
      }
    };
    fetchNotes();
  }, [isAuthenticated]);

  return { notes };
};