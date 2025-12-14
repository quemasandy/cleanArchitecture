export interface DynamoUserItem {
  pk: string; // User ID
  email: string; // GSI PK
  passwordHash: string;
  isActive: boolean;
  version: number; // Optimistic Locking
}
