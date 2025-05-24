'use client'
import { useState, useEffect } from 'react';
import axios from "axios";
import { useAuth } from "../hooks/checkAuth";
import { redirect, useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [loggingIn, setLoggingIn] = useState(false);
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === null) return;
  if (isAuthenticated) redirect('/notes');

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoggingIn(true);

    const form = e.currentTarget.closest("form")
    const formData = new FormData(form!);
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const response = await axios.post("http://localhost:8000/api/login", {
        username,
        password,
      }, {withCredentials: true});

      console.log("Login successful:", response.data);
      router.push('/notes');

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
      <form id="" className="max-w-xs lg:max-w-lg m-auto mt-12">
        
        {/* LOGO */}

        {/* Email input */}
        <div> 
          <label htmlFor="Username">
          <span className="text-sm font-medium text-gray-700"> Username </span>

          <input required
            type="text"
            id="username"
            name="username"
            className="mt-0.5 w-full rounded border-gray-300 shadow-sm sm:text-sm"
          />
          </label>
        </div>

        {/* Password input */}
        <div className="mt-5">
          <label htmlFor="Password">
          <span className="text-sm font-medium text-gray-700"> Password </span>

          <input required
            type="password"
            id="password"
            name="password"
            className="mt-0.5 w-full rounded border-gray-300 shadow-sm sm:text-sm"
          />
          </label>
        </div>

        {/* Log in button */}
    <div className="text-center mt-5">
      <button
        onClick={handleLogin}
        disabled={loggingIn}
        className="group relative inline-flex items-center overflow-hidden rounded-md bg-indigo-600 px-8 py-3 text-white focus:ring-3 focus:outline-none disabled:opacity-50"
      >
        {loggingIn ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        ) : (
          <>
            <span className="absolute -start-full transition-all group-hover:start-4">
              <img src="svg/log-in.svg" className="size-5 shadow-sm rtl:rotate-180" />
            </span>
            <span className="text-sm font-medium transition-all group-hover:ms-4">
              Log in
            </span>
          </>
        )}
      </button>
    </div>
      </form>
    </div>
  );
}
