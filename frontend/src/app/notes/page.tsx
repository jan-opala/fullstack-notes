'use client'
import { useState, useEffect } from 'react';
import axios from "axios";
import { useAuth } from "../hooks/checkAuth";
import { getNotes } from "../hooks/getNotes";
import { redirect } from 'next/navigation';

export function SidebarButton({ opened, setOpened }: { opened: boolean; setOpened: React.Dispatch<React.SetStateAction<boolean>>; }) {
  if (opened == true){
    return (
      <button onClick={() => {
        setOpened(false);
      }} className="absolute top-1/2 left-[164px] transform -translate-y-1/2 bg-zinc-700 text-black p-2 rounded-l-md shadow-md hover:bg-zinc-600">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    );
  } else {
    return (
      <button onClick={() => {
        setOpened(true);
      }} className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-zinc-700 text-black p-2 rounded-r-md shadow-md hover:bg-zinc-600">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

}

export default function Notes() {
  const [loggingIn, setLoggingIn] = useState(false);
  const { isAuthenticated } = useAuth();
  const { notes } = getNotes();
  const [ opened, setOpened ] = useState(false);

  if (isAuthenticated === null) return null; // Wait for auth check (and cookie)
  if (!isAuthenticated) {
    redirect("/login");
    return null;
  }

const listNotes = notes.map(note => (
  <div onClick={() => console.log(note.content)} key={note.id} className="text-zinc-200 py-1 pl-1 border-b border-zinc-600 border-solid hover:bg-zinc-800 cursor-pointer">
    {note.title}
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
    <>
      <div className="absolute h-screen bg-zinc-800 md:invisible">
        <SidebarButton opened={opened} setOpened={setOpened} />
      </div>
        <div className={ opened ? ("h-dvh grid gap-0.5 grid-cols-[200px_1fr] bg-zinc-900") : ("h-dvh grid grid-cols-[1px_1fr] gap-0.5 md:grid-cols-[200px_1fr] bg-zinc-900") }>

        <div className={ opened ? ("h-full bg-zinc-900") : ("h-full bg-zinc-900 invisible md:visible") }>
          {listNotes}
        </div>

        <div className="h-full bg-zinc-800">

        </div>

      </div>
    </>
  );
}
