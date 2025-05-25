'use client'
import { useState, useEffect } from 'react';
import axios from "axios";
import { useAuth } from "../hooks/checkAuth";
import { useNotes } from "../hooks/useNotes";
import { redirect } from 'next/navigation';

function SidebarButton({ opened, setOpened }: { opened: boolean; setOpened: React.Dispatch<React.SetStateAction<boolean>> }) {
  if (opened == true){
    return (
      <button onClick={() => {
        setOpened(false);
      }} className="absolute top-1/2 left-[164px] transform -translate-y-1/2 bg-stone-700 text-black p-2 rounded-l-md shadow-md hover:bg-stone-600">
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
      }} className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-stone-700 text-black p-2 rounded-r-md shadow-md hover:bg-stone-600">
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

  type Note = {
  id: string;
  title: string;
  content: string;
  };

  const [ opened, setOpened ] = useState(false);
  const { isAuthenticated } = useAuth();
  const { notes } = useNotes(isAuthenticated);
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )username=([^;]*)/);
    setUsername(match ? decodeURIComponent(match[1]) : null);
  }, []);



  useEffect(() => {
    if (!note || content === note.content) return;

    const timeout = setTimeout(() => {
      axios.post("http://localhost:8000/api/update-note", {
        id: note.id,
        content: content
      }, { withCredentials: true });
    }, 750); // 500ms debounce

    return () => clearTimeout(timeout);
  }, [content, note]);

  if (isAuthenticated === null) return(
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-500"></div>
        <span className="ml-4 text-stone-500">Authenticating...</span>
      </div>
  );
  if (!isAuthenticated) {
    redirect("/login");
    return null;
  }

const changeNote = async (newNote: Note | null) => {
  if (note != null && note.content != content) {
    const _note = note;
    _note.content = content ?? "";
    const res = await axios.post("http://localhost:8000/api/update-note", {
      "id": _note.id,
      "content": _note.content
    }, {withCredentials: true,});
    if (res.status !== 200) {
      setError("Failed to sync the note with the server, be aware of possibility of losing your data!");
      console.error("Failed to update note");
    }
  }

  if (newNote === null) {
    setNote(null);
    setContent("");
    return;
  }

  setNote(newNote);
  setContent(newNote.content ?? "");
}

function NotesSkeleton() {
  return (
    <div>
      {[...Array(5)].map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse bg-stone-700 h-5 my-2 ml-1 rounded"
          style={{ width: `${70 + Math.random() * 20}%` }}
        />
      ))}
    </div>
  );
}

const listNotes = notes == null ? (
  <NotesSkeleton />
) : (
  notes.map(note => (
    <div
      onClick={() => { changeNote(note); }}
      key={note.id}
      className="text-stone-200 py-1 pl-1 border-b border-stone-600 border-solid hover:bg-stone-800 cursor-pointer"
    >
      {note.title}
    </div>
  ))
);

  return (
    <div className="min-h-screen h-screen overflow-hidden font-sans">

      {/* alert */}
      {error != null ? (
        <div role="alert" className="absolute left-1/2 -translate-x-1/2 max-w-[300px] border-s-4 border-red-700 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>

            <strong className="font-medium"> Something went wrong </strong>
          </div>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>
        </div>
      ) : (<></>)}


      {/* Mobile sidebar open button */}
      <div className="absolute h-screen bg-stone-800 md:invisible">
        <SidebarButton opened={opened} setOpened={setOpened} />
      </div>

      {/* TOP BAR */}
      <div className="flex flex-wrap items-center justify-between mx-auto bg-stone-900 pl-2 pr-2 text-white h-[35px] border-white border-b">
        <div className="font-bold flex text-xl">
          <div className="mx-1">+</div>
          <div className="mx-1">-</div>
        </div>
        {note == null ? (
          <div className="font-bold">FULLSTACK NOTES</div>
        ) : (
          <div className="flex">
            <div onClick={() => {changeNote(null)}} className="mt-0 mr-1 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="18" height="18" viewBox="0 0 50 25">
                <path fill="#F44336" d="M21.5 4.5H26.501V43.5H21.5z" transform="rotate(45.001 24 24)"></path><path fill="#F44336" d="M21.5 4.5H26.5V43.501H21.5z" transform="rotate(135.008 24 24)"></path>
              </svg>
            </div>
            <div className="font-bold">{note.title}</div>
          </div>
        )}
        
        <div className="">{username}</div>
      </div>

      <div className={ opened ? ("h-dvh grid gap-0.5 grid-cols-[200px_1fr] bg-stone-900") : ("h-dvh grid grid-cols-[1px_1fr] gap-0.5 md:grid-cols-[200px_1fr] bg-stone-900") }>
        <div className={ opened ? ("h-full bg-stone-900") : ("h-full bg-stone-900 invisible md:visible") }>
          {listNotes}
        </div>

        <div className="h-full bg-stone-800 text-stone-200">

          {note === null ? (

            username == null ? (
              <div className="h-dvh text-center content-center">
              </div>
            ) : (
              <div className="h-dvh text-center content-center">
                <h1 className="text-3xl font-bold">Hello, {username}!</h1>
                <p>Open a note or create a new one.</p>
              </div>
            )

          ) : (
            <div className="h-full grid grid-rows-[40px_1fr]">
                <div className="w-full h-full">
                  <textarea onChange={(e) => {
                    setContent(e.target.value);
                  }}
      className="h-[99%] w-full resize-none border-0 bg-transparent font-sans text-sm font-normal outline-0 focus:ring-0"
      placeholder=" " value={content ?? ""}></textarea>
                </div>
            </div>
          ) }

        </div>

      </div>
    </div>
  );
}
