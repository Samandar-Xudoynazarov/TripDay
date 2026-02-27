export type OrgData = {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  verified: boolean;
  rejectionReason?: string;
};

export type EventItem = {
  id: number;
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  eventDateTime: string;
  organizationId: number;
};

export type RegItem = {
  id: number;
  eventId: number;
  userId: number;
  registeredAt: string;
  userFullName?: string;
  userEmail?: string;
};

export type EventStats = {
  regCount: number;
  likeCount: number;
  commentCount: number;
};
