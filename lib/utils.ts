export function resolveImageUrl(url: string | undefined | null): string {
  if (!url) return "https://placehold.co/100x100?text=No+Image";
  if (url.startsWith("http")) return url;
  if (!url.startsWith("/")) return `/${url}`;
  return url;
}
