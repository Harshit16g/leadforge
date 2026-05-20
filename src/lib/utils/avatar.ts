/**
 * Resolves a beautiful platform-provided avatar URL deterministically.
 * Hashes the name/ID to ensure visual stability across renders and updates.
 */
export function getAvatarFallbackUrl(id?: string, gender?: string): string {
  if (!id) return "/avatars/female_avatar_1.png";
  
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const isFemale = gender === "female" || (gender !== "male" && Math.abs(hash) % 2 === 0);
  if (isFemale) {
    const idx = (Math.abs(hash) % 15) + 1;
    return `/avatars/female_avatar_${idx}.png`;
  } else {
    const idx = (Math.abs(hash) % 9) + 1;
    return `/avatars/male_avatar_${idx}.png`;
  }
}
