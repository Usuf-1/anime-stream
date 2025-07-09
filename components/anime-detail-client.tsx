"use client"

import { ScrollBar } from "@/components/ui/scroll-area"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { VideoPlayer } from "@/components/video-player"
import { fetchEpisodeServers, fetchEpisodeSources } from "@/lib/api"
import { AnimeCard } from "./anime-card"

interface AnimeDetailProps {
  anime: {
    info: {
      id: string
      name: string
      poster: string
      description: string
      stats: {
        rating: string
        quality: string
        episodes: {
          sub: number
          dub: number
        }
        type: string
        duration: string
      }
      promotionalVideos: { title?: string; source?: string; thumbnail?: string }[]
      characterVoiceActor: any[] // Simplified for brevity
    }
    moreInfo: {
      aired: string
      genres: string[]
      status: string
      studios: string
      duration: string
      // ... other fields
    }
  }
  episodes: {
    number: number
    title: string
    episodeId: string
    isFiller: boolean
  }[]
  recommendedAnimes: any[] // Simplified
  relatedAnimes: any[] // Simplified
  seasons: any[] // Simplified
}

const fallbackOrder: ("sub" | "dub" | "raw")[] = ["sub", "dub", "raw"]

export function AnimeDetailClient({ anime, episodes, recommendedAnimes, relatedAnimes, seasons }: AnimeDetailProps) {
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null)
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<"sub" | "dub" | "raw">("sub")
  const [servers, setServers] = useState<{ sub: any[]; dub: any[]; raw: any[] } | null>(null)
  const [streamingSource, setStreamingSource] = useState<string | null>(null)
  const [isM3U8, setIsM3U8] = useState(false)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sourceHeaders, setSourceHeaders] = useState<Record<string, string> | null>(null)
  const [selectedServerIndex, setSelectedServerIndex] = useState(0)
  const [userError, setUserError] = useState<string | null>(null)

  useEffect(() => {
    if (episodes && episodes.length > 0) {
      setSelectedEpisode(episodes[0].episodeId)
    }
  }, [episodes])

  useEffect(() => {
    const fetchServers = async () => {
      if (selectedEpisode) {
        setIsLoadingVideo(true)
        setError(null)
        setUserError(null)
        try {
          const data = await fetchEpisodeServers(selectedEpisode)
          setServers(data)
          if (data[selectedCategory] && data[selectedCategory].length > 0) {
            setSelectedServerIndex(0)
            setSelectedServer(data[selectedCategory][0].serverName)
          } else {
            setSelectedServer(null)
            setStreamingSource(null)
            setError("No servers available for this episode/category.")
            setUserError("No streaming servers found for this episode. Please try another episode or category.")
          }
        } catch (err) {
          console.error("Failed to fetch servers:", err)
          setError("Failed to load servers for this episode.")
          setUserError("Failed to load streaming servers. Please check your internet connection or try again later.")
          setServers(null)
          setSelectedServer(null)
          setStreamingSource(null)
        } finally {
          setIsLoadingVideo(false)
        }
      }
    }
    fetchServers()
  }, [selectedEpisode, selectedCategory])

  useEffect(() => {
    const fetchSources = async () => {
      if (
        selectedEpisode &&
        servers &&
        servers[selectedCategory] &&
        servers[selectedCategory].length > selectedServerIndex
      ) {
        const currentServer = servers[selectedCategory][selectedServerIndex]
        setSelectedServer(currentServer.serverName)
        setIsLoadingVideo(true)
        setError(null)
        setUserError(null)
        try {
          const data = await fetchEpisodeSources(selectedEpisode, currentServer.serverName, selectedCategory)
          if (data.sources && data.sources.length > 0) {
            const rawUrl = data.sources[0].url
            const referer = data.headers?.Referer ?? ""
            const proxiedUrl = `/api/stream?url=${encodeURIComponent(rawUrl)}${
              referer ? `&referer=${encodeURIComponent(referer)}` : ""
            }`

            setStreamingSource(proxiedUrl)
            setIsM3U8(data.sources[0].isM3U8)
            setSourceHeaders(data.headers ?? null)
          } else {
            setStreamingSource(null)
            setError("No streaming sources found for the selected server.")
            setUserError("No streaming sources found for this server. Trying another server...")
            handleVideoError("no_sources", {})
          }
        } catch (err) {
          console.error("Failed to fetch sources:", err)
          setError("Failed to load streaming sources.")
          setUserError("Failed to load streaming sources. Trying another server...")
          handleVideoError("fetch_error", {})
        } finally {
          setIsLoadingVideo(false)
        }
      } else if (
        selectedEpisode &&
        servers &&
        servers[selectedCategory] &&
        selectedServerIndex >= servers[selectedCategory].length
      ) {
        setStreamingSource(null)
        setError("All available servers failed to load.")
        setUserError(
          "All available servers failed to load. Please try again later or select a different episode/category.",
        )
        setIsLoadingVideo(false)
      }
    }
    fetchSources()
  }, [selectedEpisode, selectedCategory, selectedServerIndex, servers])

  const handleVideoError = (errorType: string, details: any) => {
    console.warn("Fatal video error:", errorType, details)

    const sameCategoryServers = servers?.[selectedCategory] ?? []
    // ── Try next server in the SAME category ────────────────────────────────
    if (selectedServerIndex < sameCategoryServers.length - 1) {
      setUserError(`Server “${sameCategoryServers[selectedServerIndex].serverName}” failed. Trying next…`)
      setSelectedServerIndex((i) => i + 1)
      return
    }

    // ── All servers in this category are dead – switch to the next category -
    const nextCatIndex = fallbackOrder.indexOf(selectedCategory) + 1
    if (nextCatIndex < fallbackOrder.length) {
      const nextCat = fallbackOrder[nextCatIndex]
      setUserError(`All “${selectedCategory}” servers failed. Switching to ${nextCat.toUpperCase()}…`)
      setSelectedCategory(nextCat)
      // server-index will be reset by useEffect that loads servers
      return
    }

    // ── Nothing left to try ────────────────────────────────────────────────
    setStreamingSource(null)
    setError("Playback failed on every available server & category.")
    setUserError("We couldn’t start this episode anywhere. Please try again later or pick a different episode.")
  }

  const currentEpisodeNumber = episodes.find((ep) => ep.episodeId === selectedEpisode)?.number

  return (
    <div className="container py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Image
            src={anime.info.poster || "/placeholder.svg?height=400&width=300"}
            alt={anime.info.name}
            width={300}
            height={400}
            className="w-full h-auto rounded-lg shadow-lg object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=400&width=300"
            }}
          />
          <h1 className="text-3xl font-bold mt-4">{anime.info.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{anime.moreInfo.genres.join(", ")}</p>
          <div className="mt-4 text-sm">
            <p>
              <strong>Type:</strong> {anime.info.stats.type}
            </p>
            <p>
              <strong>Status:</strong> {anime.moreInfo.status}
            </p>
            <p>
              <strong>Aired:</strong> {anime.moreInfo.aired}
            </p>
            <p>
              <strong>Duration:</strong> {anime.info.stats.duration}
            </p>
            <p>
              <strong>Quality:</strong> {anime.info.stats.quality}
            </p>
            <p>
              <strong>Rating:</strong> {anime.info.stats.rating}
            </p>
            <p>
              <strong>Studios:</strong> {anime.moreInfo.studios}
            </p>
          </div>
        </div>
        <div className="md:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="episodes">Episodes</TabsTrigger>
              <TabsTrigger value="more-like-this">More Like This</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground">{anime.info.description}</p>
            </TabsContent>
            <TabsContent value="episodes" className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Episodes</h2>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Select
                  value={selectedCategory}
                  onValueChange={(value: "sub" | "dub" | "raw") => setSelectedCategory(value)}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sub">Subbed</SelectItem>
                    <SelectItem value="dub">Dubbed</SelectItem>
                    <SelectItem value="raw">Raw</SelectItem>
                  </SelectContent>
                </Select>
                {userError && (
                  <div className="text-center py-3 mb-2 rounded-md bg-destructive/10 text-destructive">{userError}</div>
                )}
                <Select
                  value={selectedServer || ""}
                  onValueChange={(val) => {
                    setSelectedServer(val)
                    setSelectedServerIndex(servers?.[selectedCategory].findIndex((s: any) => s.serverName === val) ?? 0)
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Select Server" />
                  </SelectTrigger>
                  <SelectContent>
                    {servers &&
                      servers[selectedCategory] &&
                      servers[selectedCategory].map((server: any) => (
                        <SelectItem key={server.serverId} value={server.serverName}>
                          {server.serverName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoadingVideo && <div className="text-center py-8">Loading video...</div>}
              {error && <div className="text-center py-8 text-red-500">{error}</div>}
              {!isLoadingVideo && !error && streamingSource && (
                <VideoPlayer src={streamingSource} isM3U8={isM3U8} onError={handleVideoError} />
              )}
              {!isLoadingVideo && !error && !streamingSource && selectedEpisode && (
                <div className="text-center py-8 text-muted-foreground">Select a server to play the episode.</div>
              )}
              {!selectedEpisode && <div className="text-center py-8 text-muted-foreground">No episodes available.</div>}

              <ScrollArea className="h-[400px] w-full rounded-md border p-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {episodes.map((episode) => (
                    <Button
                      key={episode.episodeId}
                      variant={selectedEpisode === episode.episodeId ? "default" : "outline"}
                      onClick={() => setSelectedEpisode(episode.episodeId)}
                      className="flex flex-col h-auto p-2 text-left"
                    >
                      <span className="font-semibold">Episode {episode.number}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{episode.title}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="more-like-this" className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Recommended Animes</h2>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border mb-8">
                <div className="flex w-max space-x-4 p-4">
                  {recommendedAnimes.map((anime) => (
                    <div key={anime.id} className="w-[160px] inline-block">
                      <AnimeCard {...anime} />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              <h2 className="text-xl font-semibold mb-2">Related Animes</h2>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-4 p-4">
                  {relatedAnimes.map((anime) => (
                    <div key={anime.id} className="w-[160px] inline-block">
                      <AnimeCard {...anime} />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
