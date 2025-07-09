const BASE_API_URL = "https://aniwatch-api1.vercel.app"

export async function fetchHomePageData() {
  const res = await fetch(`${BASE_API_URL}/api/v2/hianime/home`)
  if (!res.ok) {
    throw new Error(`Failed to fetch home page data: ${res.statusText}`)
  }
  const data = await res.json()
  return data.data
}

export async function fetchAnimeDetails(animeId: string) {
  const res = await fetch(`${BASE_API_URL}/api/v2/hianime/anime/${animeId}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch anime details for ${animeId}: ${res.statusText}`)
  }
  const data = await res.json()
  return data.data
}

export async function fetchAnimeEpisodes(animeId: string) {
  const res = await fetch(`${BASE_API_URL}/api/v2/hianime/anime/${animeId}/episodes`)
  if (!res.ok) {
    throw new Error(`Failed to fetch episodes for ${animeId}: ${res.statusText}`)
  }
  const data = await res.json()
  return data.data
}

export async function fetchEpisodeServers(animeEpisodeId: string) {
  const res = await fetch(`${BASE_API_URL}/api/v2/hianime/episode/servers?animeEpisodeId=${animeEpisodeId}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch episode servers for ${animeEpisodeId}: ${res.statusText}`)
  }
  const data = await res.json()
  return data.data
}

export async function fetchEpisodeSources(animeEpisodeId: string, server: string, category: string) {
  const res = await fetch(
    `${BASE_API_URL}/api/v2/hianime/episode/sources?animeEpisodeId=${animeEpisodeId}&server=${server}&category=${category}`,
  )
  if (!res.ok) {
    throw new Error(`Failed to fetch episode sources for ${animeEpisodeId} on server ${server}: ${res.statusText}`)
  }
  const data = await res.json()
  return data.data
}

export async function searchAnime(query: string, page = 1) {
  const res = await fetch(`${BASE_API_URL}/api/v2/hianime/search?q=${encodeURIComponent(query)}&page=${page}`)
  if (!res.ok) {
    throw new Error(`Failed to search anime for ${query}: ${res.statusText}`)
  }
  const data = await res.json()
  return data.data
}
