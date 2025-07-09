"use client"

import type React from "react"

import Link from "next/link"
import { MountainIcon, SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { searchAnime } from "@/lib/api" // Import searchAnime

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([]) // State for suggestions
  const [showSuggestions, setShowSuggestions] = useState(false) // State to control suggestion visibility
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false) // State for loading indicator
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Ref for debounce timeout
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false) // Hide suggestions after search
    }
  }

  // Effect for debounced search suggestions
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (searchQuery.trim().length > 2) {
      // Only search if query is at least 3 characters
      setIsLoadingSuggestions(true)
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const data = await searchAnime(searchQuery.trim(), 1) // Fetch suggestions
          setSuggestions(data.animes || [])
          setShowSuggestions(true)
        } catch (error) {
          console.error("Error fetching search suggestions:", error)
          setSuggestions([])
          setShowSuggestions(false)
        } finally {
          setIsLoadingSuggestions(false)
        }
      }, 300) // Debounce for 300ms
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setIsLoadingSuggestions(false)
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleSuggestionClick = (animeName: string) => {
    setSearchQuery(animeName)
    router.push(`/search?q=${encodeURIComponent(animeName)}`)
    setShowSuggestions(false)
  }

  const handleInputBlur = () => {
    // Delay hiding to allow click event on suggestion to fire
    setTimeout(() => setShowSuggestions(false), 100)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0 || isLoadingSuggestions) {
      setShowSuggestions(true)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <MountainIcon className="h-6 w-6" />
          <span className="font-bold">AnimeStream</span>
        </Link>
        <nav className="flex-1 flex items-center justify-end space-x-4">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search anime..."
              className="w-full pl-9 pr-4 rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <Button type="submit" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7">
              Search
            </Button>
            {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
              <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                {isLoadingSuggestions ? (
                  <div className="p-2 text-sm text-gray-500">Loading suggestions...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((anime) => (
                    <div
                      key={anime.id}
                      className="p-2 text-sm cursor-pointer hover:bg-gray-100"
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur from hiding before click
                      onClick={() => handleSuggestionClick(anime.name)}
                    >
                      {anime.name}
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">No suggestions found.</div>
                )}
              </div>
            )}
          </form>
        </nav>
      </div>
    </header>
  )
}
