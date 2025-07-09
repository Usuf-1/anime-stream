"use client"

import Image from "next/image"
import Link from "next/link"

import { AnimeCard } from "@/components/anime-card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface AnimeItem {
  id: string
  name: string
  poster: string
  type?: string
  episodes?: {
    sub: number
    dub: number
  }
  duration?: string
  rating?: string
  rank?: number
  description?: string
  jname?: string
  otherInfo?: string[]
}

interface HomeSectionsProps {
  spotlightAnimes: AnimeItem[]
  latestEpisodeAnimes: AnimeItem[]
  topAiringAnimes: AnimeItem[]
  trendingAnimes: AnimeItem[]
}

export function HomeSections({
  spotlightAnimes,
  latestEpisodeAnimes,
  topAiringAnimes,
  trendingAnimes,
}: HomeSectionsProps) {
  return (
    <div className="container py-8">
      {spotlightAnimes && spotlightAnimes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Spotlight Animes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spotlightAnimes.slice(0, 3).map((anime) => (
              <div key={anime.id} className="relative rounded-lg overflow-hidden shadow-lg">
                <Link href={`/anime/${anime.id}`}>
                  <Image
                    src={anime.poster || "/placeholder.svg?height=400&width=600"}
                    alt={anime.name}
                    width={600}
                    height={400}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=400&width=600"
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end text-white">
                    <h3 className="text-xl font-bold mb-1">{anime.name}</h3>
                    <p className="text-sm line-clamp-2">{anime.description}</p>
                    {anime.episodes && (anime.episodes.sub > 0 || anime.episodes.dub > 0) && (
                      <div className="text-xs text-gray-300 mt-1">
                        {anime.episodes.sub > 0 && `Sub: ${anime.episodes.sub}`}
                        {anime.episodes.sub > 0 && anime.episodes.dub > 0 && " | "}
                        {anime.episodes.dub > 0 && `Dub: ${anime.episodes.dub}`}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {latestEpisodeAnimes && latestEpisodeAnimes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Latest Episodes</h2>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              {latestEpisodeAnimes.map((anime) => (
                <div key={anime.id} className="w-[160px] inline-block">
                  <AnimeCard {...anime} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {topAiringAnimes && topAiringAnimes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Top Airing Animes</h2>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              {topAiringAnimes.map((anime) => (
                <div key={anime.id} className="w-[160px] inline-block">
                  <AnimeCard {...anime} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {trendingAnimes && trendingAnimes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Trending Animes</h2>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              {trendingAnimes.map((anime) => (
                <div key={anime.id} className="w-[160px] inline-block">
                  <AnimeCard {...anime} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}
    </div>
  )
}
