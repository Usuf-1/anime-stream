"use client"

import { useEffect, useRef } from "react"
import Hls from "hls.js" // Import hls.js

interface VideoPlayerProps {
  src: string
  isM3U8: boolean
  onError?: (errorType: string, details: any) => void // NEW: Callback for fatal errors
}

export function VideoPlayer({ src, isM3U8, onError }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null) // Ref to store the Hls instance

  useEffect(() => {
    if (videoRef.current) {
      if (isM3U8) {
        if (Hls.isSupported()) {
          // If HLS is already initialized, destroy it first
          if (hlsRef.current) {
            hlsRef.current.destroy()
          }

          const hls = new Hls()
          hls.loadSource(src)
          hls.attachMedia(videoRef.current)
          hlsRef.current = hls // Store the Hls instance

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error("Fatal HLS error:", data) // Log the error for debugging
              if (onError) {
                onError(data.type, data) // Notify parent about the fatal error
              }
              // Do not attempt recovery here; let the parent handle it (e.g., switch servers)
              hls.destroy() // Destroy HLS instance to prevent further attempts on this source
            }
          })
        } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
          // Native HLS support for Safari
          videoRef.current.src = src
        } else {
          console.error("HLS is not supported in this browser.")
        }
      } else {
        // For non-HLS videos, ensure HLS instance is destroyed if it exists
        if (hlsRef.current) {
          hlsRef.current.destroy()
          hlsRef.current = null
        }
        videoRef.current.src = src
      }
    }

    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src, isM3U8, onError])

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video ref={videoRef} controls className="w-full h-full" />
    </div>
  )
}
