'use client'
import { useState, useEffect, useRef } from 'react';
import axios from "axios";
import { useAuth } from "../hooks/checkAuth";
import { useNotes } from "../hooks/useNotes";
import { redirect } from 'next/navigation';
import Image from 'next/image';

// TODO:
// Markdown implementation (edit view and markdown view OR combined)
// Make it beautiful

function SidebarButton({ opened, setOpened }: { opened: boolean; setOpened: React.Dispatch<React.SetStateAction<boolean>> }) {
  if (opened == true){
    return (
      <button onClick={() => {
        setOpened(false);
      }} className="absolute top-1/2 left-[266px] transform -translate-y-1/2 bg-stone-700 text-black p-2 rounded-l-md shadow-md hover:bg-stone-600">
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

  const newTitleRef = useRef<HTMLInputElement>(null);

  const [ opened, setOpened ] = useState(false);
  const { isAuthenticated } = useAuth();
  const { notes, refreshNotes } = useNotes(isAuthenticated);
  const [ currentNote, setCurrentNote ] = useState<Note | null>(null);
  const [ content, setContent ] = useState<string | null>(null);
  const [ username, setUsername ] = useState<string | null>(null);
  const [ error, setError ] = useState<string | null>(null);
  const [ uploading, setUploading ] = useState<boolean>(false);
  const [ renaming, setRenaming ] = useState<boolean>(false);
  const [ removing, setRemoving ] = useState<boolean>(false);

  // fetch username from cookie
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )username=([^;]*)/);
    setUsername(match ? decodeURIComponent(match[1]) : null);
  }, []);

  // Handle current note refresh when notes refresh.
  useEffect(() => {
    if (currentNote) {
      
      const updatedNote = notes?.find((note) => note.id === currentNote.id);
      if (updatedNote) {
        setCurrentNote(updatedNote);
        setContent(updatedNote.content);
      } else {
        setCurrentNote(null);
        setContent(null);
      }
  }
  }, [notes]);

  // Upload content of note after user stops typing for 1250ms
  useEffect(() => {
    if (!currentNote || content === currentNote.content) return;
    setUploading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.post("http://localhost:8000/api/update-note", {
          id: currentNote.id,
          content: content
        }, { withCredentials: true });
        if (res.status !== 200) {
        setError("Failed to sync the note with the server, be aware of possibility of losing your data!");
        setTimeout(() => {setError(null)}, 15000);
      }
      } catch (error) {
        setError("Failed to sync the note with the server, be aware of possibility of losing your data!");
        setTimeout(() => {setError(null)}, 15000);
      }
      setUploading(false);
    }, 1250);

    return () => {
      setUploading(false);
      clearTimeout(timeout);
    };
  }, [content, currentNote]);

  // Sync local notes with server every 1 second.
  useEffect(() => {
    if (!uploading) {
      const interval = setInterval(() => {
        refreshNotes();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [uploading]);

  // Check if user is authenticated, if not redirect him to login page.
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
  if (currentNote != null && currentNote.content != content) {
    const _note = currentNote;
    _note.content = content ?? "";
    try {
      const res = await axios.post("http://localhost:8000/api/update-note", {
        "id": _note.id,
        "content": _note.content
      }, {withCredentials: true,});
      if (res.status !== 200) {
      setError("Failed to sync the note with the server, be aware of possibility of losing your data!");
      setTimeout(() => {setError(null)}, 15000);
    }
    } catch (error) {
      setError("Failed to sync the note with the server, be aware of possibility of losing your data!");
      setTimeout(() => {setError(null)}, 15000);
    }
  }

  if (newNote === null) {
    setCurrentNote(null);
    setContent("");
    return;
  }

  setCurrentNote(newNote);
  setContent(newNote.content ?? "");
  setOpened(false);
}

const renameNote = async (note: Note | null, newTitle: string | null) => {
  if (note != null && newTitle != null) {
    const _note = note;
    _note.title = newTitle;
    try {
      const res = await axios.post("http://localhost:8000/api/update-note", {
        "id": _note.id,
        "title": _note.title
      }, {withCredentials: true,});
      if (res.status !== 200) {
      setError("Failed to change the title of the note.");
      setTimeout(() => {setError(null)}, 15000);
    }
    } catch (error) {
      setError("Failed to change the title of the note.");
      setTimeout(() => {setError(null)}, 15000);
    }
  }
}

const removeNote = async (note: Note | null) => {
  if (note != null) {
    try {
      const res = await axios.post("http://localhost:8000/api/delete-note", {
        "id": note.id,
      }, {withCredentials: true,});
      if (res.status !== 200) {
        setError("Failed remove the note.");
        setTimeout(() => {setError(null)}, 15000);
      }
      if (note == currentNote) {
        setCurrentNote(null);
      }
    } catch (error) {
      setError("Failed to remove the note.");
      setTimeout(() => {setError(null)}, 15000);
    }
  }
}

const createNote = async () => {
  try {
    const res = await axios.post("http://localhost:8000/api/new-note", {
      "title": "New note"
    }, {withCredentials: true,});
    if (res.status !== 200) {
      setError("Failed to create a new note.");
      setTimeout(() => {setError(null)}, 15000);
    }
    refreshNotes();
    changeNote(res.data)
  } catch (error) {
    setError("Failed to create a new note.");
    setTimeout(() => {setError(null)}, 15000);
  }
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

const listNotes = notes == null ? (<NotesSkeleton />) : (
    notes.map(nnote => (
      <div
        onClick={() => { changeNote(nnote); }}
        key={nnote.id}
        className={nnote.id === currentNote?.id 
          ? "text-stone-200 py-1 pl-1 border-b border-stone-600 border-solid bg-stone-800 hover:bg-stone-800 cursor-pointer"
          : "text-stone-200 py-1 pl-1 border-b border-stone-600 border-solid hover:bg-stone-800 cursor-pointer"
        }
      >
        {nnote.title}
      </div>
    )));

  return (
    <div className="min-h-screen h-screen overflow-hidden font-sans">

      {/* error alert */}
      {error != null &&
        <div role="alert" className="absolute top-[50px] left-1/2 -translate-x-1/2 max-w-[300px] border-s-4 border-red-700 bg-red-50 p-4">
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
      }
      
      {/* Mobile sidebar open button */}
      <div className="absolute h-screen bg-stone-800 md:invisible">
        <SidebarButton opened={opened} setOpened={setOpened} />
      </div>

      {/* Note renaming */}
      {renaming && 
      <>
        <div className="text-white absolute w-full h-full bg-transparent text-center items-center backdrop-blur-[2px]">
          <div className="fixed inset-0 z-50 grid place-content-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalTitle"
            >
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
              <div className="flex items-start justify-between">
                <h2 id="modalTitle" className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                  Change title
                </h2>

                <button
                  onClick={() => {setRenaming(false);}}
                  type="button"
                  className="-me-4 -mt-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 focus:outline-none dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-4">
                <p className="text-pretty text-gray-700 dark:text-gray-200">
                  Change the note title and click done.
                </p>

                <label htmlFor="Confirm" className="mt-4 block">

                  <input
                    type="text"
                    id="newtitle"
                    className="mt-0.5 w-full rounded border-gray-300 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    defaultValue={currentNote?.title}
                    ref={newTitleRef}
                  />
                </label>
              </div>

              <footer className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {setRenaming(false);}}
                  type="button"
                  className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>

                <button
                onClick={() => {
                  
                  const newTitle = newTitleRef.current?.value;
                  if (newTitle == "" || newTitle == null || newTitle == undefined) {
                    setError("Title of the note cannot be empty.");
                    setTimeout(() => {setError(null);}, 3000)
                    setRenaming(false);
                    return;
                  }
                  if (newTitle.length > 50) {
                    setError("Title of the note cannot be longer than 50 characters.")
                    setTimeout(() => {setError(null);}, 3000)
                    setRenaming(false);
                    return;
                  }
                  setRenaming(false);
                  renameNote(currentNote, newTitle);
                  
                }}
                  type="button"
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Done
                </button>
              </footer>
            </div>
          </div>
        </div>
      </>
      }

      {/* Note removing */}
      {removing && 
      <>
        <div className="text-white absolute w-full h-full bg-transparent text-center items-center backdrop-blur-[2px]">
          <div className="fixed inset-0 z-50 grid place-content-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalTitle"
            >
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
              <div className="flex items-start justify-between">
                <h2 id="modalTitle" className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                  Remove note
                </h2>

                <button
                  onClick={() => {setRemoving(false);}}
                  type="button"
                  className="-me-4 -mt-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 focus:outline-none dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-4">
                <p className="text-pretty text-gray-700 dark:text-gray-200">
                  Are you sure you want to remove this note?
                </p>
              </div>

              <footer className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {setRemoving(false);}}
                  type="button"
                  className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  No, cancel.
                </button>

                <button
                onClick={() => {
                  
                  setRemoving(false);
                  removeNote(currentNote);
                  
                }}
                  type="button"
                  className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Yes.
                </button>
              </footer>
            </div>
          </div>
        </div>
      </>
      }


      {/* TOP BAR */}
      <div className="flex flex-wrap items-center justify-between mx-auto bg-stone-900 pl-2 pr-2 text-white h-[50px] border-white border-b">
        <div className="font-bold flex text-xl items-center">
          <div onClick={createNote} className="mx-1 cursor-pointer"><Image alt="" src="svg/create.svg" width={20} height={20} /></div>
        </div>
        {currentNote == null ? (
          <div className="font-bold">NOTES</div>
        ) : (
          <div className="flex items-center">
            <div onClick={() => {changeNote(null)}} className="cursor-pointer mr-2">
              <Image alt="" src="svg/x.svg" width={22} height={22} />
            </div>
            <div className="font-bold">{currentNote.title}</div>
            <div onClick={() => {setRenaming(true)}} className="ml-2 fill-white cursor-pointer"><Image alt="" src="svg/rename.svg" width={22} height={22} /></div>
            <div onClick={() => {setRemoving(true)}} className="ml-2 fill-white cursor-pointer"><Image alt="" src="svg/delete.svg" width={22} height={22} /></div>
            { uploading ? <div className="ml-2"><Image className="animate-bounce" alt="" src="svg/cloud.svg" width={24} height={24}/></div>
                        : <div className="ml-2"><Image className="invisible" alt="" src="svg/cloud.svg" width={24} height={24}/></div>}
          </div>
        )}
        
        <div className="flex items-center">

          <p>{username}</p>
        </div>
      </div>
      
      {/* NOTE EDITOR AND SIDEBAR (NOTE LIST) */}
      <div className={ opened ? ("h-dvh grid gap-0.5 grid-cols-[300px_1fr] bg-stone-900") : ("h-dvh grid grid-cols-[1px_1fr] gap-0.5 md:grid-cols-[300px_1fr] bg-stone-900") }>
        <div className={ opened ? ("h-full bg-stone-900") : ("h-full bg-stone-900 invisible md:visible") }>
          {listNotes}
        </div>

        <div className="h-full bg-stone-800 text-stone-200">

          {currentNote === null ? (

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
