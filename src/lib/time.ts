export const TAIPEI_TIME_ZONE = "Asia/Taipei";

export function formatTaipeiTime(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TAIPEI_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}
