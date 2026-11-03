import { getInitials } from "../../components/UserAvatar";

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const daysAgo = (date: Date) =>
  Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / 86400000
  );

export const formatTime = (value: number | string | Date) =>
  new Date(value).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });

// iMessage list style: time today, "Yesterday", weekday within a week, else a date
export const formatThreadDate = (value: number | string | Date) => {
  const date = new Date(value);
  const days = daysAgo(date);
  if (days === 0) return formatTime(date);
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-AU", { weekday: "long" });
  return date.toLocaleDateString("en-AU");
};

// Label shown above each day's bubbles, e.g. "Today" or "Mon 12 Oct"
export const formatBubbleDay = (value: number | string | Date) => {
  const date = new Date(value);
  const days = daysAgo(date);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
  });
};

export const isSameDay = (a: number | string | Date, b: number | string | Date) =>
  startOfDay(new Date(a)).getTime() === startOfDay(new Date(b)).getTime();

const AVATAR_COLORS = ["#0B1F44", "#3B6A8C", "#1E5AA8", "#4B5D7A", "#2F4858"];

export const avatarFor = (name: string) => {
  const isAAS = /^aas\b/i.test(name.trim());
  const initials = isAAS ? "AAS" : getInitials(name) || "?";
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return {
    initials,
    color: AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length],
  };
};
