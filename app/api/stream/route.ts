import { type NextRequest, NextResponse } from "next/server"

// Define CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Allow all origins for simplicity, consider restricting in production
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Range",
}

/**
 * Handles CORS preflight requests.
 */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: CORS_HEADERS })
}

/**
 * Simple streaming proxy.
 * Query params:
 *   url     – REQUIRED  (absolute http/https URL to the media file / manifest)
 *   referer – OPTIONAL  (set as `Referer` header when fetching the remote asset)
 *
 * The route pipes the remote response (including partial range requests) back
 * to the client while copying critical headers.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  const referer = req.nextUrl.searchParams.get("referer") ?? undefined

  if (!url || !(url.startsWith("http://") || url.startsWith("https://"))) {
    return NextResponse.json({ error: "Invalid or missing url parameter." }, { status: 400 })
  }

  // Determine if the request is for an HLS manifest based on the URL
  const isManifestRequest = url.toLowerCase().includes(".m3u8")

  try {
    // Forward original Range header (for seeking) if present.
    const range = req.headers.get("range") ?? undefined

    const upstream = await fetch(decodeURIComponent(url), {
      headers: {
        // Add a common User-Agent to mimic a browser
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        ...(referer ? { Referer: decodeURIComponent(referer) } : {}),
        ...(range ? { Range: range } : {}),
      },
    })

    // If the upstream server answered with an error (4xx/5xx), forward it verbatim.
    // This ensures hls.js receives a network error directly.
    if (upstream.status >= 400) {
      const headers = new Headers(CORS_HEADERS)
      ;["content-type", "content-length"].forEach((h) => {
        const v = upstream.headers.get(h)
        if (v) headers.set(h, v)
      })
      return new NextResponse(await upstream.arrayBuffer(), {
        status: upstream.status,
        headers,
      })
    }

    // Read Content-Type from upstream response
    const contentType = upstream.headers.get("content-type")?.toLowerCase() ?? ""

    // If it's a manifest request but the Content-Type is HTML, reject it immediately.
    if (isManifestRequest && contentType.includes("text/html")) {
      return new NextResponse("Upstream returned HTML for an HLS manifest request.", {
        status: 400,
        headers: { ...CORS_HEADERS, "content-type": "text/plain" },
      })
    }

    // For non-manifest requests (e.g., video segments) or non-HTML content,
    // pipe the response through without further body validation.
    if (!isManifestRequest || !contentType.includes("application/vnd.apple.mpegurl")) {
      const headers = new Headers(CORS_HEADERS)
      upstream.headers.forEach((v, k) => headers.set(k, v))
      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers,
      })
    }

    // ─── Validate that we truly received an HLS playlist by inspecting the body ────────────────
    const rawBody = await upstream.arrayBuffer()
    const firstKb = new TextDecoder().decode(rawBody.slice(0, 4096))

    // Extract the first non-blank line
    const firstLine =
      firstKb
        .replace(/^\uFEFF?/u, "") // strip UTF-8 BOM
        .split(/\r?\n/)
        .find((l) => l.trim() !== "") // first non-empty
        ?.trim() ?? ""

    // Quick heuristics to spot HTML tags within the initial part of the body
    const looksLikeHtmlInBody = /<\s*(html|head|body|script|title|meta)[\s>]/i.test(firstKb)

    // A valid HLS manifest must start with #EXTM3U and not contain HTML tags in its beginning
    const isHlsManifestValid = firstLine === "#EXTM3U" && !looksLikeHtmlInBody

    if (!isHlsManifestValid) {
      // If validation fails, return HTTP 400 to signal an invalid manifest
      return new NextResponse("Invalid HLS manifest format or contains HTML.", {
        status: 400,
        headers: { ...CORS_HEADERS, "content-type": "text/plain" },
      })
    }

    // ---------------- We have a valid playlist: rewrite its URIs -------------
    const playlistText = new TextDecoder().decode(rawBody)

    const base = new URL(url)
    const basePrefix = base.href.slice(0, base.href.lastIndexOf("/") + 1)

    const proxiedLines = playlistText
      .split("\n")
      .map((line) => {
        const trimmed = line.trim()
        // Keep comments and blanks untouched
        if (trimmed === "" || trimmed.startsWith("#")) return trimmed

        // Build absolute URL for relative paths
        const absolute = trimmed.startsWith("http") ? trimmed : basePrefix + trimmed

        // Return SAME proxy URL for every segment / child-manifest
        return `/api/stream?url=${encodeURIComponent(absolute)}${
          referer ? `&referer=${encodeURIComponent(referer)}` : ""
        }`
      })
      .join("\n")

    // Copy status & selected headers that matter to the client↔player.
    const resHeaders = new Headers(CORS_HEADERS) // Start with CORS headers
    ;["content-type", "content-length", "accept-ranges", "content-range", "cache-control"].forEach((h) => {
      const v = upstream.headers.get(h)
      if (v) resHeaders.set(h, v)
    })

    return new NextResponse(proxiedLines, {
      status: 200,
      headers: { ...resHeaders, "content-type": "application/vnd.apple.mpegurl" },
    })
  } catch (err) {
    console.error("Stream proxy error:", err)
    return NextResponse.json({ error: "Upstream fetch failed." }, { status: 502, headers: CORS_HEADERS }) // Add CORS headers to error response
  }
}
