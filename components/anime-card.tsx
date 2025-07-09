import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface AnimeCardProps {
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
}

export function AnimeCard({ id, name, poster, type, episodes, duration, rating }: AnimeCardProps) {
  return (
    <Link href={`/anime/${id}`} className="block">
      <Card className="w-full h-full overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-0 relative">
          <Image
            src={poster || "/placeholder.svg?height=300&width=200"}
            alt={name}
            width={200}
            height={300}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=300&width=200"
            }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white">
            <h3 className="text-sm font-semibold truncate">{name}</h3>
            {(type || episodes) && (
              <div className="text-xs text-gray-300 flex items-center gap-2">
                {type && <span>{type}</span>}
                {episodes && (episodes.sub > 0 || episodes.dub > 0) && (
                  <span>
                    {episodes.sub > 0 && `Sub: ${episodes.sub}`}
                    {episodes.sub > 0 && episodes.dub > 0 && " | "}
                    {episodes.dub > 0 && `Dub: ${episodes.dub}`}
                  </span>
                )}
              </div>
            )}
            {(duration || rating) && (
              <div className="text-xs text-gray-300 flex items-center gap-2">
                {duration && <span>{duration}</span>}
                {rating && <span>{rating}</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
