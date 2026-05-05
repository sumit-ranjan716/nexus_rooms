/// <reference types="vite/client" />

import { apiClient } from '@nexus/api-client';
import type { User } from '@nexus/types';

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  source: 'api' | 'demo';
}

export interface SignupResult {
  user: User;
  message: string;
  verificationRequired: true;
}

export interface AuthStatus {
  user: User;
  accessToken: string;
}

function buildDemoSession(email: string): AuthSession {
  const displayName = email.split('@')[0] || 'Nexus User';

  return {
    user: {
      id: 'demo-user',
      email,
      displayName,
      avatarUrl: null,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    accessToken: 'demo-access-token',
    source: 'demo',
  };
}

async function login(email: string, password: string): Promise<AuthSession> {
  const response = await apiClient.login(email, password);
  apiClient.setAccessToken(response.accessToken);

  return {
    ...response,
    source: 'api',
  };
}

async function signup(email: string, password: string, displayName: string): Promise<SignupResult> {
  return apiClient.signup(email, password, displayName);
}

async function restoreSession(): Promise<AuthStatus | null> {
  try {
    const response = await apiClient.refreshToken();
    apiClient.setAccessToken(response.accessToken);
    return response;
  } catch {
    return null;
  }
}

async function logout(): Promise<void> {
  try {
    await apiClient.logout();
  } finally {
    apiClient.clearAccessToken();
  }
}

async function verifyEmail(token: string): Promise<{ message: string }> {
  return apiClient.verifyEmail(token);
}

async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiClient.forgotPassword(email);
}

async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return apiClient.resetPassword(token, password);
}

export const authService = {
  login,
  signup,
  restoreSession,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  buildDemoSession,
};
