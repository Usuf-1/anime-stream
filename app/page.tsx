import { Suspense } from "react"
import { fetchHomePageData } from "@/lib/api"
import { HomeSections } from "@/components/home-sections"
import { Header } from "@/components/header"

export default async function HomePage() {
  let homeData
  try {
    homeData = await fetchHomePageData()
  } catch (error) {
    console.error("Error fetching home page data:", error)
    // Handle error gracefully, maybe show a message to the user
    homeData = {
      spotlightAnimes: [],
      latestEpisodeAnimes: [],
      topAiringAnimes: [],
      trendingAnimes: [],
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div>Loading home page...</div>}>
          <HomeSections
            spotlightAnimes={homeData.spotlightAnimes}
            latestEpisodeAnimes={homeData.latestEpisodeAnimes}
            topAiringAnimes={homeData.topAiringAnimes}
            trendingAnimes={homeData.trendingAnimes}
          />
        </Suspense>
      </main>
    </div>
  )
}
