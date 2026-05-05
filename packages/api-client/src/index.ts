/// <reference types="vite/client" />

import { z } from 'zod';
import type * as Types from '@nexus/types';
import { requestSchemas, responseSchemas } from './contracts';
import { ApiClientError } from './errors';

const runtimeEnvironmentSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3001'),
  VITE_APP_URL: z.string().url().optional(),
});

const runtimeEnvironment = runtimeEnvironmentSchema.parse(import.meta.env);
const API_URL = runtimeEnvironment.VITE_API_URL;

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    responseSchema?: z.ZodType<T>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    });

    const parseJson = async (): Promise<unknown> => {
      const text = await response.text();
      if (!text) {
        return null;
      }

      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new ApiClientError('API returned invalid JSON', response.status, 'INVALID_JSON', text);
      }
    };

    if (!response.ok) {
      const errorBody = await parseJson();
      const errorSchemaResult = responseSchemas.apiErrorSchema.safeParse(errorBody);

      if (errorSchemaResult.success) {
        throw new ApiClientError(
          errorSchemaResult.data.error.message,
          response.status,
          errorSchemaResult.data.error.code,
          errorSchemaResult.data.error.details
        );
      }

      throw new ApiClientError(response.statusText || 'API request failed', response.status, 'HTTP_ERROR', errorBody);
    }

    const body = await parseJson();

    if (!responseSchema) {
      return body as T;
    }

    const parsed = responseSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiClientError('API response contract validation failed', response.status, 'CONTRACT_ERROR', parsed.error.flatten());
    }

    return parsed.data;
  }

  // Health Check
  async getHealthStatus(): Promise<Types.ApiSuccessResponse<Types.HealthCheckResponse>> {
    return this.request('/api/v1/health', {}, responseSchemas.health);
  }

  // Auth
  async login(email: string, password: string): Promise<Types.LoginResponse> {
    const payload = requestSchemas.login.parse({ email, password });

    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, responseSchemas.auth).then((response) => response.data);
  }

  async signup(
    email: string,
    password: string,
    displayName: string
  ): Promise<Types.SignupResponse> {
    const payload = requestSchemas.signup.parse({ email, password, displayName });

    return this.request('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, responseSchemas.signup).then((response) => response.data);
  }

  async logout(): Promise<void> {
    await this.request('/api/v1/auth/logout', { method: 'POST' }, responseSchemas.authMessage);
    this.clearAccessToken();
  }

  async refreshToken(): Promise<Types.LoginResponse> {
    return this.request('/api/v1/auth/refresh', { method: 'POST' }, responseSchemas.auth).then(
      (response) => response.data
    );
  }

  async verifyEmail(token: string): Promise<Types.AuthMessageResponse> {
    const payload = requestSchemas.verifyEmail.parse({ token });

    return this.request('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, responseSchemas.authMessage).then((response) => response.data);
  }

  async forgotPassword(email: string): Promise<Types.AuthMessageResponse> {
    const payload = requestSchemas.forgotPassword.parse({ email });

    return this.request('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, responseSchemas.authMessage).then((response) => response.data);
  }

  async resetPassword(token: string, password: string): Promise<Types.AuthMessageResponse> {
    const payload = requestSchemas.resetPassword.parse({ token, password });

    return this.request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, responseSchemas.authMessage).then((response) => response.data);
  }

  async getCurrentUser(): Promise<Types.CurrentUserResponse> {
    return this.request('/api/v1/auth/me', { method: 'GET' }, responseSchemas.currentUser).then(
      (response) => response.data
    );
  }

  // Rooms
  async getRooms(): Promise<Types.Room[]> {
    return this.request('/api/v1/rooms', {}, responseSchemas.rooms).then((response) => response.data);
  }

  async getRoom(roomId: string): Promise<Types.Room> {
    return this.request(`/api/v1/rooms/${roomId}`, {}, responseSchemas.room).then((response) => response.data);
  }

  async createRoom(data: Types.CreateRoomRequest): Promise<Types.Room> {
    const payload = requestSchemas.createRoom.parse(data);

    return this.request('/api/v1/rooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, responseSchemas.room).then((response) => response.data);
  }

  async updateRoom(roomId: string, data: Types.UpdateRoomRequest): Promise<Types.Room> {
    const payload = requestSchemas.updateRoom.parse(data);

    return this.request(`/api/v1/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, responseSchemas.room).then((response) => response.data);
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.request(`/api/v1/rooms/${roomId}`, { method: 'DELETE' }, responseSchemas.empty);
  }

  // Room Members
  async getRoomMembers(roomId: string): Promise<Types.RoomMember[]> {
    return this.request(`/api/v1/rooms/${roomId}/members`, {}, responseSchemas.roomMembers).then(
      (response) => response.data
    );
  }

  async updateMemberRole(
    roomId: string,
    userId: string,
    role: Types.RoomRole
  ): Promise<Types.RoomMember> {
    z.string().uuid().parse(roomId);
    z.string().uuid().parse(userId);

    return this.request(`/api/v1/rooms/${roomId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }, responseSchemas.roomMember).then((response) => response.data);
  }

  async removeMember(roomId: string, userId: string): Promise<void> {
    z.string().uuid().parse(roomId);
    z.string().uuid().parse(userId);

    await this.request(`/api/v1/rooms/${roomId}/members/${userId}`, {
      method: 'DELETE',
    }, responseSchemas.empty);
  }

  // Invite Links
  async generateInviteLink(
    roomId: string,
    data: Types.GenerateInviteLinkRequest
  ): Promise<Types.InviteLink> {
    z.string().uuid().parse(roomId);
    const payload = requestSchemas.generateInviteLink.parse(data);

    return this.request(`/api/v1/rooms/${roomId}/invites`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, responseSchemas.inviteLink).then((response) => response.data);
  }

  async getInviteLinks(roomId: string): Promise<Types.InviteLink[]> {
    z.string().uuid().parse(roomId);

    return this.request(`/api/v1/rooms/${roomId}/invites`, {}, responseSchemas.inviteLinks).then(
      (response) => response.data
    );
  }

  async revokeInviteLink(roomId: string, inviteId: string): Promise<void> {
    z.string().uuid().parse(roomId);
    z.string().uuid().parse(inviteId);

    await this.request(`/api/v1/rooms/${roomId}/invites/${inviteId}/revoke`, {
      method: 'POST',
    }, responseSchemas.empty);
  }

  async revokeAllInvites(roomId: string): Promise<void> {
    z.string().uuid().parse(roomId);

    await this.request(`/api/v1/rooms/${roomId}/invites/revoke-all`, {
      method: 'POST',
    }, responseSchemas.empty);
  }

  async joinRoomViaInvite(
    roomId: string,
    token: string,
    password?: string
  ): Promise<Types.LoginResponse> {
    const payload = requestSchemas.joinRoom.parse({ roomId, token, password });

    return this.request('/api/v1/join', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, responseSchemas.auth).then((response) => response.data);
  }

  // Content
  async getContent(roomId: string): Promise<Types.PaginatedResponse<Types.ContentItem>> {
    z.string().uuid().parse(roomId);

    return this.request(`/api/v1/rooms/${roomId}/content`, {}, responseSchemas.contentItems).then(
      (response) => response.data
    );
  }

  async getPresignedUrl(
    roomId: string,
    data: Types.PresignedUrlRequest
  ): Promise<Types.PresignedUrlResponse> {
    z.string().uuid().parse(roomId);
    const payload = requestSchemas.presignedUrl.parse(data);

    return this.request(`/api/v1/rooms/${roomId}/content/presign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, responseSchemas.presignedUrl).then((response) => response.data);
  }

  async createContent(
    roomId: string,
    data: Types.CreateContentRequest
  ): Promise<Types.ContentItem> {
    z.string().uuid().parse(roomId);
    const payload = requestSchemas.createContent.parse(data);

    return this.request(`/api/v1/rooms/${roomId}/content`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, responseSchemas.contentItem).then((response) => response.data);
  }

  async getDownloadUrl(contentId: string): Promise<{ downloadUrl: string }> {
    z.string().uuid().parse(contentId);

    return this.request(`/api/v1/content/${contentId}/download`, {}, responseSchemas.downloadUrl).then(
      (response) => response.data
    );
  }

  async deleteContent(contentId: string): Promise<void> {
    z.string().uuid().parse(contentId);

    await this.request(`/api/v1/content/${contentId}`, { method: 'DELETE' }, responseSchemas.empty);
  }
}

export const apiClient = new ApiClient();

export default apiClient;
