"use client";

import { Search } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder }: SearchBarProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-xl mx-auto"
    >
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onSearch(e.target.value.trim());
        }}
        placeholder={placeholder || "Search videos"}
        className="w-full bg-surface border border-border rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder:text-text-muted"
      />
    </form>
  );
}
