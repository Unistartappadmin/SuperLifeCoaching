export type ServiceSlug = "free-call" | "clarifying-session" | "breakthrough-package" | "transformational-package";

export type BookingService = {
  slug: ServiceSlug;
  name: string;
  price: number;
  duration: number;
  sessions?: number;
  description: string;
};

export const SERVICES: Record<ServiceSlug, BookingService> = {
  "free-call": {
    slug: "free-call",
    name: "Free Initial Call",
    price: 0,
    duration: 30,
    description: "A complimentary 30-minute discovery session to explore your goals.",
  },
  "clarifying-session": {
    slug: "clarifying-session",
    name: "1:1 Coaching Session – Clarifying",
    price: 69,
    duration: 45,
    description: "A focused 45-minute session for clarity and direction.",
  },
  "breakthrough-package": {
    slug: "breakthrough-package",
    name: "Breakthrough Coaching Package – 4 Sessions",
    price: 290,
    duration: 60,
    sessions: 4,
    description: "A transformative 4-session program (60 mins each).",
  },
  "transformational-package": {
    slug: "transformational-package",
    name: "Transformational Coaching Package – 12 Sessions",
    price: 790,
    duration: 60,
    sessions: 12,
    description: "A comprehensive 12-session coaching program for deep transformation.",
  },
};

export const serviceSlugList = Object.keys(SERVICES) as ServiceSlug[];
