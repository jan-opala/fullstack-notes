'use client'
import { useState, useEffect } from 'react';
import axios from "axios";
import { useAuth } from "./hooks/checkAuth";

export default function Home() {
  const [loggingIn, setLoggingIn] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleLogin = async (e: { preventDefault: () => void; target: { closest: (arg0: string) => any; }; }) => {
    e.preventDefault();
    setLoggingIn(true);

    const form = e.target.closest("form")
    const formData = new FormData(form);
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const response = await axios.post("http://localhost:8000/api/login", {
        username,
        password,
      }, {withCredentials: true});

      console.log("Login successful:", response.data);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Login failed:", error.response?.data || error.message);
      } else {
        console.error("Unexpected error:", error);
      }
    } finally {
      setLoggingIn(false);
    }
  };



  return (
    <div>
      <h1>Homepage</h1>
      <a href="/login">Log in</a>
      <a href="/notes"> My notes</a>
    </div>
  );
}
