import type { PublicEvent } from "@/lib/public-events";
import { absoluteUrl } from "@/lib/site";

const TAIPEI_TIME_ZONE = "Asia/Taipei";

export function publicEventPath(eventId: string) {
  return `/events/${encodeURIComponent(eventId)}`;
}

export function eventDescription({ event }: PublicEvent) {
  const time = new Intl.DateTimeFormat("zh-TW", {
    timeZone: TAIPEI_TIME_ZONE,
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(event.eventStartAt);
  const location = `${event.restaurantName || "餐廳待確認"}，${event.venueAddress}`;
  const summary = event.description?.trim() || "透過主辦人審核，認識願意一起好好吃飯的新朋友。";
  return `DineLink 飯局：${event.title}。${time}，${location}。${summary}`.slice(0, 180);
}

export function eventJsonLd(publicEvent: PublicEvent) {
  const { event, host } = publicEvent;
  const path = publicEventPath(event.id);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: eventDescription(publicEvent),
    startDate: event.eventStartAt.toISOString(),
    ...(event.eventEndAt ? { endDate: event.eventEndAt.toISOString() } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: [absoluteUrl("/opengraph-image")],
    url: absoluteUrl(path),
    location: {
      "@type": "Place",
      name: event.restaurantName || event.venueAddress,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venueAddress,
        addressCountry: "TW",
      },
      ...(event.latitude && event.longitude ? { geo: { "@type": "GeoCoordinates", latitude: event.latitude, longitude: event.longitude } } : {}),
    },
    organizer: { "@type": "Person", name: host.displayName },
  };
}
