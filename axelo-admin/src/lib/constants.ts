export const TRACKED_COMPETITORS = [
  { name: "Pollmans Tours", url: "pollmans.com" },
  { name: "Scenic Safaris", url: "scenicsafaris.com" },
  { name: "Bush and Beyond", url: "bush-and-beyond.com" },
  { name: "Bonfire Adventures", url: "bonfireadventures.com" },
  { name: "African Portfolio", url: "africanportfolio.com" },
  { name: "Sarova Safaris", url: "sarovahotels.com" },
];

export const INTEL_ACTION_BADGES = {
  blog: { label: "Write blog post", color: "bg-blue-100 text-blue-700" },
  landing: { label: "Build landing page", color: "bg-purple-100 text-purple-700" },
  optimize: { label: "Add to package name", color: "bg-amber-100 text-amber-700" },
} as const;

export type IntelActionType = keyof typeof INTEL_ACTION_BADGES;
