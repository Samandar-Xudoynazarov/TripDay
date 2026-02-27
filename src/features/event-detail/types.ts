export type EventData = {
  id: number;
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  eventDateTime: string; // ISO string
  organizationId: number;
  organizationName?: string;
  ownerId?: number;
};

export type CommentItem = {
  id?: number;
  text: string;
  userId?: number;
  eventId?: number;
  createdAt: string; // ISO string
};
