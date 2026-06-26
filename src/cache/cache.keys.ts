import { createHash } from 'crypto';

function stableHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

export const CacheVersionKeys = {
  parkingAreas: 'parking-areas:version',
  admin: {
    reservations: 'version:admin:reservations',
    users: 'version:admin:users',
    vehicles: 'version:admin:vehicles',
    parkingHistory: 'version:admin:parking-history',
    payments: 'version:admin:payments',
    rfid: 'version:admin:rfid',
    rfidRequests: 'version:admin:rfid-requests',
  },
  user: {
    reservations: (userId: string) => `version:user:${userId}:reservations`,
    parkingHistory: (userId: string) => `version:user:${userId}:parking-history`,
    payments: (userId: string) => `version:user:${userId}:payments`,
    rfid: (userId: string) => `version:user:${userId}:rfid`,
    rfidRequests: (userId: string) => `version:user:${userId}:rfid-requests`,
  },
} as const;

export const CacheKeys = {
  parkingAreasList: (version: string, query: unknown) =>
    `parking-areas:v${version}:list:${stableHash(query)}`,
  userVehicles: (userId: string) => `vehicles:user:${userId}`,
  userProfile: (userId: string) => `users:profile:${userId}`,
  adminList: (resource: string, version: string, query: unknown) =>
    `${resource}:admin:v${version}:list:${stableHash(query)}`,
  userList: (resource: string, userId: string, version: string, query: unknown) =>
    `${resource}:user:${userId}:v${version}:list:${stableHash(query)}`,
} as const;
