/// <reference types="vite/client" />

import { apiClient } from '@nexus/api-client';
import type { User } from '@nexus/types';

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  source: 'api' | 'demo';
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
    },
    accessToken: 'demo-access-token',
    source: 'demo',
  };
}

async function login(email: string, password: string): Promise<AuthSession> {
  try {
    const response = await apiClient.login(email, password);

    return {
      ...response,
      source: 'api',
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      return buildDemoSession(email);
    }

    throw error;
  }
}

export const authService = {
  login,
  buildDemoSession,
};
