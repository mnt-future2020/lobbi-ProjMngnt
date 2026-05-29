export const FOLDER_COLORS = [
  {
    value: null,
    label: "Default",
    dot: "bg-gray-300",
    card: {
      bg: "",
      border: "border-gray-200",
      icon: "text-brand/40 group-hover:text-brand/70",
    },
  },
  {
    value: "red",
    label: "Red — Completed",
    dot: "bg-red-500",
    card: {
      bg: "bg-red-50/60",
      border: "border-red-200",
      icon: "text-red-400 group-hover:text-red-500",
    },
  },
  {
    value: "green",
    label: "Green — In Progress",
    dot: "bg-green-500",
    card: {
      bg: "bg-green-50/60",
      border: "border-green-200",
      icon: "text-green-400 group-hover:text-green-500",
    },
  },
  {
    value: "blue",
    label: "Blue",
    dot: "bg-blue-500",
    card: {
      bg: "bg-blue-50/60",
      border: "border-blue-200",
      icon: "text-blue-400 group-hover:text-blue-500",
    },
  },
  {
    value: "yellow",
    label: "Yellow",
    dot: "bg-yellow-400",
    card: {
      bg: "bg-yellow-50/60",
      border: "border-yellow-200",
      icon: "text-yellow-400 group-hover:text-yellow-500",
    },
  },
  {
    value: "purple",
    label: "Purple",
    dot: "bg-purple-500",
    card: {
      bg: "bg-purple-50/60",
      border: "border-purple-200",
      icon: "text-purple-400 group-hover:text-purple-500",
    },
  },
  {
    value: "orange",
    label: "Orange",
    dot: "bg-orange-500",
    card: {
      bg: "bg-orange-50/60",
      border: "border-orange-200",
      icon: "text-orange-400 group-hover:text-orange-500",
    },
  },
];

export function getFolderColorStyle(color?: string | null) {
  return (
    FOLDER_COLORS.find((c) => c.value === (color ?? null)) ?? FOLDER_COLORS[0]
  );
}
