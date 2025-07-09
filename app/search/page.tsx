import { Suspense } from "react"
import { searchAnime } from "@/lib/api"
import { Header } from "@/components/header"
import { AnimeCard } from "@/components/anime-card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination"

interface SearchPageProps {
  searchParams: {
    q?: string
    page?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ""
  const page = Number.parseInt(searchParams.page || "1")

  let searchResults
  try {
    searchResults = await searchAnime(query, page)
  } catch (error) {
    console.error("Error fetching search results:", error)
    searchResults = { animes: [], currentPage: 1, totalPages: 1 }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">Search Results for &quot;{query}&quot;</h1>
        <Suspense fallback={<div>Loading search results...</div>}>
          {searchResults.animes.length === 0 ? (
            <p className="text-muted-foreground">No anime found for your search query.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.animes.map((anime: any) => (
                <AnimeCard key={anime.id} {...anime} />
              ))}
            </div>
          )}

          {searchResults.totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={`/search?q=${query}&page=${page - 1}`} />
                  </PaginationItem>
                )}
                {Array.from({ length: searchResults.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink href={`/search?q=${query}&page=${pageNum}`} isActive={pageNum === page}>
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {page < searchResults.totalPages && (
                  <PaginationItem>
                    <PaginationNext href={`/search?q=${query}&page=${page + 1}`} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </Suspense>
      </main>
    </div>
  )
}
