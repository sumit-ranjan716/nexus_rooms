export interface User {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    createdAt: Date;
}
export interface Room {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    hasPassword: boolean;
    createdBy: string;
    memberCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export type RoomRole = 'admin' | 'viewer';
export interface RoomMember {
    id: string;
    roomId: string;
    userId: string;
    user?: {
        displayName: string | null;
        email: string;
    };
    role: RoomRole;
    joinedAt: Date;
}
export interface InviteLink {
    id: string;
    token: string;
    url: string;
    role: RoomRole;
    expiresAt: Date | null;
    isSingleUse: boolean;
    isRevoked: boolean;
    usedAt: Date | null;
    createdAt: Date;
}
export type ContentType = 'pdf' | 'image';
export interface ContentItem {
    id: string;
    roomId: string;
    type: ContentType;
    title: string;
    fileSizeBytes: number;
    mimeType: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, unknown>;
}
export type ApiErrorCode = 'BAD_REQUEST' | 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR';
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
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    user: User;
    accessToken: string;
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
export interface GenerateInviteLinkRequest {
    role: RoomRole;
    expiresIn: '24h' | '7d' | '30d' | 'never';
    isSingleUse?: boolean;
}
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
//# sourceMappingURL=index.d.ts.map