// User Types
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Room Types
export interface Room {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  hasPassword: boolean;
  createdBy: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

// Room Member Types
export type RoomRole = 'admin' | 'editor' | 'viewer';

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  user?: {
    displayName: string | null;
    email: string;
  };
  role: RoomRole;
  joinedAt: string;
}

// Invite Link Types
export interface InviteLink {
  id: string;
  token: string;
  url: string;
  role: RoomRole;
  expiresAt: string | null;
  isSingleUse: boolean;
  isRevoked: boolean;
  usedAt: string | null;
  createdAt: string;
}

// Content Item Types
export type ContentType = 'pdf' | 'image' | 'document' | 'link' | 'text';

export interface ContentItem {
  id: string;
  roomId: string;
  type: ContentType;
  title: string;
  fileSizeBytes: number;
  mimeType: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

// API Response Types
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiResponseMeta {
  requestId?: string;
  timestamp?: string;
  version?: string;
}

export interface ApiErrorDetails {
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetails | unknown;
    requestId?: string;
    timestamp: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthCheckResponse {
  status: 'ok';
  version: string;
  timestamp: string;
  uptime?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface SignupResponse {
  user: User;
  message: string;
  verificationRequired: true;
}

export interface AuthMessageResponse {
  message: string;
}

export interface CurrentUserResponse {
  user: User;
  session: {
    sessionId: string;
    expiresAt: string;
  };
}

export interface SignUpRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Room Types for API
export interface CreateRoomRequest {
  name: string;
  description?: string;
  password?: string;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
}

export interface JoinRoomRequest {
  roomId: string;
  token?: string;
  password?: string;
  createAccount?: boolean;
}

// Invite Types for API
export interface GenerateInviteLinkRequest {
  role: RoomRole;
  expiresIn: '24h' | '7d' | '30d' | 'never';
  isSingleUse?: boolean;
}

// Content Upload Types
export interface PresignedUrlRequest {
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface PresignedUrlResponse {
  uploadId: string;
  presignedUrl: string;
  expiresIn: number;
}

export interface CreateContentRequest {
  uploadId: string;
  filename: string;
  title?: string;
  mimeType: string;
  fileSizeBytes: number;
}
