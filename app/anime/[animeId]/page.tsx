import { Suspense } from "react"
import { fetchAnimeDetails, fetchAnimeEpisodes } from "@/lib/api"
import { AnimeDetailClient } from "@/components/anime-detail-client"
import { Header } from "@/components/header"

interface AnimeDetailPageProps {
  params: {
    animeId: string
  }
}

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { animeId } = params

  let animeData
  let episodesData

  try {
    animeData = await fetchAnimeDetails(animeId)
    episodesData = await fetchAnimeEpisodes(animeId)
  } catch (error) {
    console.error(`Error fetching data for anime ${animeId}:`, error)
    // Handle error, e.g., redirect to a 404 page or show an error message
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Header />
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold">Anime Not Found or Error Loading</h1>
          <p className="text-muted-foreground mt-2">Could not load details for this anime. Please try again later.</p>
        </div>
      </div>
    )
  }

  // NEW ― normalize & validate the returned structure
  const animeDetails = Array.isArray(animeData?.anime) ? animeData.anime[0] : animeData?.anime

  if (!animeDetails || !animeDetails.info) {
    // If the API didn’t return usable data, show an error page
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Header />
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold">Anime Not Found</h1>
          <p className="text-muted-foreground mt-2">We couldn’t load details for this title. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div>Loading anime details...</div>}>
          <AnimeDetailClient
            anime={animeDetails}
            episodes={episodesData.episodes}
            recommendedAnimes={animeData.recommendedAnimes ?? []}
            relatedAnimes={animeData.relatedAnimes ?? []}
            seasons={animeData.seasons ?? []}
          />
        </Suspense>
      </main>
    </div>
  )
}
