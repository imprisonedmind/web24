export function withTmdbPosterSize(url: string, size: "w342" | "w500" | "w780") {
  if (!url.includes("image.tmdb.org/t/p/")) {
    return url;
  }

  return url.replace(/\/t\/p\/[^/]+\//, `/t/p/${size}/`);
}
