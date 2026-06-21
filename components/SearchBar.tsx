"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Note } from "@/lib/notes";

interface SearchBarProps {
  notes: Note[];
}

export default function SearchBar({ notes }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset only necessary state on route change
  useEffect(() => {
    setSearchTerm("");
    setSelectedIndex(-1);
  }, [pathname]);

  const navigateToNote = (note: Note) => {
    setSearchTerm("");
    setSelectedIndex(-1);
    router.push(`/notes/${note.slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredNotes.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredNotes.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredNotes.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          navigateToNote(filteredNotes[selectedIndex]);
        } else if (filteredNotes.length > 0) {
          navigateToNote(filteredNotes[0]);
        }
        break;
      case "Escape":
        setIsFocused(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 py-3 bg-[#071224] border-b border-[#1e3354]">
      <input
        type="text"
        placeholder="Search notes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-2 rounded-lg bg-[#132541] border border-[#1e3354] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      {isFocused && searchTerm && filteredNotes.length > 0 && (
        <div className="absolute top-full left-4 right-4 mt-2 bg-[#0d1b31] border border-[#1e3354] rounded-lg shadow-lg z-[9999] max-h-96 overflow-y-auto">
          <div className="p-2 space-y-1">
            {filteredNotes.map((note, index) => (
              <button
                key={note.slug}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => navigateToNote(note)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left block px-3 py-2 rounded-md text-white transition ${
                  selectedIndex === index ? "bg-[#1b3358]" : "hover:bg-[#1b3358]"
                }`}
              >
                {note.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
