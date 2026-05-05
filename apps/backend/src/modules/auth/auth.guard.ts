import type { RoomRole } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import type { AppEnvironment } from '../../config/env';
import { AppError } from '../../lib/http';
import { prisma } from '../../lib/prisma';
import { verifyAccessToken } from '../../lib/jwt';

export interface AuthContext {
  userId: string;
  email: string;
  emailVerified: boolean;
  sessionId: string;
}

const roleRank: Record<RoomRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
};

function getBearerToken(request: FastifyRequest): string {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
  }

  return token;
}

export async function authenticateRequest(
  request: FastifyRequest,
  env: AppEnvironment
): Promise<AuthContext> {
  const token = getBearerToken(request);
  const payload = await verifyAccessToken(env, token);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user) {
    throw new AppError('User account not found', 404, 'NOT_FOUND');
  }

  return {
    userId: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    sessionId: payload.sessionId,
  };
}

export async function requireRoomRole(
  userId: string,
  roomId: string,
  minimumRole: RoomRole
): Promise<RoomRole> {
  const membership = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
    select: {
      role: true,
      room: {
        select: {
          isDeleted: true,
        },
      },
    },
  });

  if (!membership || membership.room.isDeleted) {
    throw new AppError('Room not found', 404, 'NOT_FOUND');
  }

  if (roleRank[membership.role] < roleRank[minimumRole]) {
    throw new AppError('Insufficient room permissions', 403, 'FORBIDDEN');
  }

  return membership.role;
}
