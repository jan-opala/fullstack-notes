'use client'
import { useState, useEffect, useRef } from 'react';
import axios from "axios";
import { useAuth } from "../hooks/checkAuth";
import { useNotes } from "../hooks/useNotes";
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import html from 'remark-html';
import DOMPurify from 'dompurify';

// Minimalistic Sidebar Toggle Button
function SidebarButton({ opened, setOpened }: { opened: boolean; setOpened: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <button
      onClick={() => setOpened(!opened)}
      className={`absolute top-1/2 left-0 z-20 transform -translate-y-1/2 bg-stone-800 text-stone-400 p-2 rounded-r-md shadow hover:bg-stone-700 transition-all duration-300 opacity-70 md:hidden`}
      aria-label={opened ? "Close sidebar" : "Open sidebar"}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        {opened ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}

export default function Notes() {
  type Note = {
    id: string;
    title: string;
    content: string;
  };

  const newTitleRef = useRef<HTMLInputElement>(null);

  const [opened, setOpened] = useState(false);
  const { isAuthenticated } = useAuth();
  const { notes, refreshNotes } = useNotes(isAuthenticated);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [mdContent, setMdContent] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [renaming, setRenaming] = useState<boolean>(false);
  const [removing, setRemoving] = useState<boolean>(false);
  const [splitView, setSplitView] = useState<boolean>(false);

  // fetch username from cookie
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )username=([^;]*)/);
    setUsername(match ? decodeURIComponent(match[1]) : null);
  }, []);

  // Handle current note refresh when notes refresh.
  useEffect(() => {
    if (currentNote) {
      const updatedNote = notes?.find((note) => note.id === currentNote.id);
      if (updatedNote && (updatedNote.content !== content || updatedNote.title !== currentNote.title)) {
        setCurrentNote(updatedNote);
        setContent(updatedNote.content);
        parseMarkdown(updatedNote.content);
      } else if (!updatedNote) {
        setCurrentNote(null);
        setContent(null);
        parseMarkdown(null);
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
          setError("Failed to sync the note with the server.");
          setTimeout(() => { setError(null); }, 5000);
        }
      } catch {
        setError("Failed to sync the note with the server.");
        setTimeout(() => { setError(null); }, 5000);
      }
      setUploading(false);
      parseMarkdown(content);
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

  // Auth check
  if (isAuthenticated === null) return (
    <div className="flex items-center justify-center h-screen bg-stone-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-500"></div>
      <span className="ml-4 text-stone-500">Authenticating...</span>
    </div>
  );
  if (!isAuthenticated) {
    redirect("/login");
    return null;
  }

  function addClassToAllElements(html: string, className: string) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    wrapper.querySelectorAll("*").forEach(el => el.classList.add(className));
    return wrapper.innerHTML;
  }

  const parseMarkdown = async (content: string | null) => {
    if (content != null) {
      const markdown = await remark().use(remarkGfm).use(html).process(content);
      const markdownWithClasses = addClassToAllElements(markdown.toString(), "break-words");
      if (mdContent !== markdownWithClasses) { setMdContent(markdownWithClasses); }
    } else {
      if (mdContent != null) { setMdContent(null); }
    }
  };

  const toggleSplitView = () => setSplitView(prev => !prev);

  const changeNote = async (newNote: Note | null) => {
    if (currentNote && currentNote.content !== content) {
      try {
        await axios.post("http://localhost:8000/api/update-note", {
          id: currentNote.id,
          content: content
        }, { withCredentials: true });
      } catch {
        setError("Failed to sync the note with the server.");
        setTimeout(() => { setError(null); }, 5000);
      }
    }
    if (newNote === null) {
      setCurrentNote(null);
      setContent("");
      parseMarkdown(null);
      return;
    }
    setCurrentNote(newNote);
    setContent(newNote.content ?? "");
    parseMarkdown(newNote.content);
    setOpened(false);
  };

  const renameNote = async (note: Note | null, newTitle: string | null) => {
    if (note && newTitle) {
      try {
        await axios.post("http://localhost:8000/api/update-note", {
          id: note.id,
          title: newTitle
        }, { withCredentials: true });
      } catch {
        setError("Failed to change the title of the note.");
        setTimeout(() => { setError(null); }, 5000);
      }
    }
  };

  const removeNote = async (note: Note | null) => {
    if (note) {
      try {
        await axios.post("http://localhost:8000/api/delete-note", {
          id: note.id,
        }, { withCredentials: true });
        if (note === currentNote) setCurrentNote(null);
      } catch {
        setError("Failed to remove the note.");
        setTimeout(() => { setError(null); }, 5000);
      }
    }
  };

  const createNote = async () => {
    try {
      const res = await axios.post("http://localhost:8000/api/new-note", {
        title: "New note"
      }, { withCredentials: true });
      refreshNotes();
      changeNote(res.data);
    } catch {
      setError("Failed to create a new note.");
      setTimeout(() => { setError(null); }, 5000);
    }
  };

  function NotesSkeleton() {
    return (
      <div>
        {[...Array(5)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse bg-stone-800 h-4 my-2 rounded"
            style={{ width: `${70 + Math.random() * 20}%` }}
          />
        ))}
      </div>
    );
  }

  const listNotes = notes == null ? (<NotesSkeleton />) : (
    notes.map(nnote => (
      <button
        onClick={() => { changeNote(nnote); }}
        key={nnote.id}
        className={`w-full text-left px-3 py-2 rounded transition font-medium
          ${nnote.id === currentNote?.id
            ? "bg-stone-800 text-white"
            : "text-stone-400 hover:bg-stone-800 hover:text-white"}
        `}
        style={{ outline: "none" }}
      >
        {nnote.title}
      </button>
    ))
  );

  // Minimalistic modal
  function Modal({ open, onClose, children }: { open: boolean, onClose: () => void, children: React.ReactNode }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-stone-900 rounded-lg shadow-lg p-6 min-w-[300px] max-w-sm w-full relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-stone-500 hover:text-stone-300" aria-label="Close">
            <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l8 8M6 14L14 6" /></svg>
          </button>
          {children}
        </div>
      </div>
    );
  }

  // MarkdownPreview component
  function MarkdownPreview({ mdContent }: { mdContent: string | null }) {
    return (
      <div className="flex-1 min-h-0 p-4">
        <div className="h-full border border-stone-800 rounded-lg bg-transparent">
          <div className="h-full overflow-auto p-3">
            {mdContent && (
              <div
                className="
                  prose prose-invert prose-img:max-w-xs prose-sm break-words max-w-full
                  font-normal text-base min-h-full placeholder:text-stone-600
                "
                style={{
                  fontFamily: "inherit",
                  margin: 0,
                }}
                dangerouslySetInnerHTML={{ __html: mdContent }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-stone-950 font-sans text-stone-200 flex flex-col">
      {/* Error Alert */}
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded shadow z-50 text-sm">
          {error}
        </div>
      )}

      {/* Top Bar (moves to bottom on mobile) */}
      <header
        className={`
          flex items-center justify-between h-14 px-4 bg-stone-900 border-b border-stone-800
          fixed w-full left-0 top-0 z-30
          md:static md:border-b
          transition-all
          ${/* Move to bottom on mobile */''}
          md:top-0
          bottom-0
          md:bottom-auto
          ${typeof window !== "undefined" && window.innerWidth < 768 ? "top-auto bottom-0 border-t border-b-0" : ""}
        `}
        style={{
          // On mobile, stick to bottom; on desktop, stick to top
          top: typeof window !== "undefined" && window.innerWidth < 768 ? "auto" : 0,
          bottom: typeof window !== "undefined" && window.innerWidth < 768 ? 0 : "auto",
          borderTop: typeof window !== "undefined" && window.innerWidth < 768 ? "1px solid #292524" : undefined,
          borderBottom: typeof window !== "undefined" && window.innerWidth < 768 ? "none" : undefined,
        }}
      >
        <button onClick={createNote} className="p-2 rounded-full hover:bg-stone-800 transition" aria-label="New note">
          <Image alt="New" src="svg/create.svg" width={20} height={20} />
        </button>
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight truncate max-w-[40vw]">
          {currentNote ? (
            <>
              {currentNote.title}
              <button onClick={() => setRenaming(true)} className="p-1 rounded hover:bg-stone-800 transition" aria-label="Rename note">
                <Image alt="Rename" src="svg/rename.svg" width={18} height={18} />
              </button>
              <button onClick={() => setRemoving(true)} className="p-1 rounded hover:bg-stone-800 transition" aria-label="Delete note">
                <Image alt="Delete" src="svg/delete.svg" width={18} height={18} />
              </button>
              {uploading && (
                <span className="ml-1">
                  <Image className="animate-bounce" alt="" src="svg/cloud.svg" width={18} height={18} />
                </span>
              )}
            </>
          ) : (
            "NOTES"
          )}
        </span>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-stone-800 transition" onClick={toggleSplitView} aria-label="Toggle split view">
            <Image alt="Split" src="svg/view-split.svg" width={20} height={20} />
          </button>
          <span className="text-stone-400 text-sm">{username}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className={`
            transition-all duration-300 bg-stone-900 border-r border-stone-800
            ${opened ? "w-48" : "w-0"}
            md:w-64 md:block
            overflow-y-auto
            flex-shrink-0
            relative
            z-10
          `}
          style={{ minWidth: opened ? 192 : 0 }}
        >
          <nav className="flex flex-col gap-1 p-2">{listNotes}</nav>
        </aside>

        {/* Mobile Sidebar Button */}
        <SidebarButton opened={opened} setOpened={setOpened} />

        {/* Editor Area */}
        <main className="flex-1 flex flex-col min-h-0">
          {currentNote === null ? (
            <div className="flex flex-col justify-center items-center h-full text-stone-400">
              <h1 className="text-3xl font-bold mb-2">Hello, {username}!</h1>
              <p className="text-base">Open a note or create a new one.</p>
            </div>
          ) : splitView ? (
            <div className="flex flex-col sm:flex-row flex-1 min-h-0">
              <div className="flex-1 flex flex-col min-h-0 p-4">
                <textarea
                  onChange={e => setContent(e.target.value)}
                  className="flex-1 w-full resize-none bg-transparent text-base font-normal outline-none focus:ring-0 rounded-lg border border-stone-800 p-3 transition placeholder:text-stone-600"
                  placeholder="Start typing your note..."
                  value={content ?? ""}
                  spellCheck={false}
                  style={{ minHeight: 0 }}
                />
              </div>
              <MarkdownPreview mdContent={mdContent} />
            </div>
          ) : (
              <MarkdownPreview mdContent={mdContent} />
          )}
        </main>
      </div>

      {/* Rename Modal */}
      <Modal open={renaming} onClose={() => setRenaming(false)}>
        <h2 className="text-lg font-semibold mb-4">Rename Note</h2>
        <input
          type="text"
          className="w-full rounded border border-stone-700 bg-stone-800 text-white p-2 mb-4 outline-none"
          defaultValue={currentNote?.title}
          ref={newTitleRef}
          maxLength={50}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setRenaming(false)}
            className="px-4 py-2 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const newTitle = newTitleRef.current?.value?.trim();
              if (!newTitle) {
                setError("Title of the note cannot be empty.");
                setTimeout(() => { setError(null); }, 3000);
                setRenaming(false);
                return;
              }
              setRenaming(false);
              renameNote(currentNote, newTitle);
            }}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* Remove Modal */}
      <Modal open={removing} onClose={() => setRemoving(false)}>
        <h2 className="text-lg font-semibold mb-4">Remove Note</h2>
        <p className="mb-6 text-stone-300">Are you sure you want to remove this note?</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setRemoving(false)}
            className="px-4 py-2 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setRemoving(false);
              removeNote(currentNote);
            }}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
          >
            Remove
          </button>
        </div>
      </Modal>
    </div>
  );
}