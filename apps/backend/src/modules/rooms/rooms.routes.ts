import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { ContentType, RoomRole } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AppEnvironment } from '../../config/env';
import { AppError, buildRequestMeta, sendSuccess } from '../../lib/http';
import { prisma } from '../../lib/prisma';
import { authenticateRequest, requireRoomRole } from '../auth/auth.guard';

interface RoomRouteOptions {
  env: AppEnvironment;
}

const roomIdParamsSchema = z.object({ roomId: z.string().uuid() });
const roomMemberParamsSchema = z.object({ roomId: z.string().uuid(), userId: z.string().uuid() });
const inviteJoinSchema = z.object({ roomId: z.string().uuid(), token: z.string().min(1), password: z.string().min(8).optional() });
const createRoomBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  password: z.string().min(8).max(128).optional(),
});
const updateRoomBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
});
const updateMemberRoleBodySchema = z.object({ role: z.enum(['admin', 'editor', 'viewer']) });
const generateInviteSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer']),
  expiresIn: z.enum(['24h', '7d', '30d', 'never']),
  isSingleUse: z.boolean().optional(),
});
const contentTypeSchema = z.enum(['pdf', 'image', 'document', 'link', 'text']);
const createContentSchema = z.object({
  uploadId: z.string().min(1).optional(),
  filename: z.string().min(1).max(255),
  title: z.string().min(1).max(255).optional(),
  mimeType: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().nonnegative(),
  type: contentTypeSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});
const presignedUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive(),
});

function buildRoomSlug(): string {
  return randomBytes(4).toString('hex').toLowerCase();
}

function buildInviteToken(): string {
  return randomBytes(24).toString('hex');
}

function expiresAtFromPreset(expiresIn: '24h' | '7d' | '30d' | 'never'): Date | null {
  const now = Date.now();
  switch (expiresIn) {
    case '24h':
      return new Date(now + 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now + 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

function inferContentType(mimeType: string): ContentType {
  const normalized = mimeType.toLowerCase();
  if (normalized.startsWith('image/')) return 'image';
  if (normalized === 'application/pdf') return 'pdf';
  if (normalized.startsWith('text/plain') || normalized === 'text/markdown') return 'text';
  if (normalized === 'text/uri-list') return 'link';
  return 'document';
}

function serializeRoom(room: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  passwordHash: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { members: number };
}) {
  return {
    id: room.id,
    slug: room.slug,
    name: room.name,
    description: room.description,
    hasPassword: Boolean(room.passwordHash),
    createdBy: room.createdBy,
    memberCount: room._count.members,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}

function serializeInvite(invite: {
  id: string;
  token: string;
  role: RoomRole;
  expiresAt: Date | null;
  isSingleUse: boolean;
  isRevoked: boolean;
  usedAt: Date | null;
  createdAt: Date;
}, appUrl: string) {
  return {
    id: invite.id,
    token: invite.token,
    url: `${appUrl}/join/${invite.token}`,
    role: invite.role,
    expiresAt: invite.expiresAt ? invite.expiresAt.toISOString() : null,
    isSingleUse: invite.isSingleUse,
    isRevoked: invite.isRevoked,
    usedAt: invite.usedAt ? invite.usedAt.toISOString() : null,
    createdAt: invite.createdAt.toISOString(),
  };
}

function serializeContentItem(item: {
  id: string;
  roomId: string;
  type: ContentType;
  title: string;
  fileSizeBytes: number;
  mimeType: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: unknown;
}) {
  return {
    id: item.id,
    roomId: item.roomId,
    type: item.type,
    title: item.title,
    fileSizeBytes: item.fileSizeBytes,
    mimeType: item.mimeType ?? 'application/octet-stream',
    createdBy: item.createdBy,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    ...(item.metadata && typeof item.metadata === 'object' ? { metadata: item.metadata as Record<string, unknown> } : {}),
  };
}

export async function registerRoomRoutes(app: FastifyInstance, options: RoomRouteOptions): Promise<void> {
  app.get('/api/v1/rooms', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);

    const memberships = await prisma.roomMember.findMany({
      where: { userId: auth.userId, room: { isDeleted: false } },
      include: { room: { include: { _count: { select: { members: true } } } } },
      orderBy: { joinedAt: 'desc' },
    });

    return sendSuccess(reply, memberships.map((membership) => serializeRoom(membership.room)), 200, buildRequestMeta(request, 'v1'));
  });

  app.get('/api/v1/rooms/:roomId', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = roomIdParamsSchema.parse(request.params);
    await requireRoomRole(auth.userId, params.roomId, 'viewer');

    const room = await prisma.room.findFirst({
      where: { id: params.roomId, isDeleted: false },
      include: { _count: { select: { members: true } } },
    });

    if (!room) throw new AppError('Room not found', 404, 'NOT_FOUND');
    return sendSuccess(reply, serializeRoom(room), 200, buildRequestMeta(request, 'v1'));
  });

  app.post('/api/v1/rooms', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const body = createRoomBodySchema.parse(request.body);
    const passwordHash = body.password ? await bcrypt.hash(body.password, options.env.BCRYPT_COST) : null;

    const room = await prisma.room.create({
      data: {
        slug: buildRoomSlug(),
        name: body.name,
        description: body.description ?? null,
        passwordHash,
        createdBy: auth.userId,
        members: { create: { userId: auth.userId, role: 'admin' } },
      },
      include: { _count: { select: { members: true } } },
    });

    return sendSuccess(reply, serializeRoom(room), 201, buildRequestMeta(request, 'v1'));
  });

  app.put('/api/v1/rooms/:roomId', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = roomIdParamsSchema.parse(request.params);
    const body = updateRoomBodySchema.parse(request.body);
    await requireRoomRole(auth.userId, params.roomId, 'editor');

    const room = await prisma.room.update({
      where: { id: params.roomId },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      },
      include: { _count: { select: { members: true } } },
    });

    return sendSuccess(reply, serializeRoom(room), 200, buildRequestMeta(request, 'v1'));
  });

  app.delete('/api/v1/rooms/:roomId', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = roomIdParamsSchema.parse(request.params);
    await requireRoomRole(auth.userId, params.roomId, 'admin');

    await prisma.room.update({ where: { id: params.roomId }, data: { isDeleted: true } });
    return sendSuccess(reply, null, 200, buildRequestMeta(request, 'v1'));
  });

  app.get('/api/v1/rooms/:roomId/members', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = roomIdParamsSchema.parse(request.params);
    await requireRoomRole(auth.userId, params.roomId, 'viewer');

    const members = await prisma.roomMember.findMany({
      where: { roomId: params.roomId },
      include: { user: { select: { displayName: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    return sendSuccess(reply, members.map((member) => ({
      id: member.id,
      roomId: member.roomId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      user: { displayName: member.user.displayName, email: member.user.email },
    })), 200, buildRequestMeta(request, 'v1'));
  });

  app.put('/api/v1/rooms/:roomId/members/:userId', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = roomMemberParamsSchema.parse(request.params);
    const body = updateMemberRoleBodySchema.parse(request.body);
    await requireRoomRole(auth.userId, params.roomId, 'admin');

    const member = await prisma.roomMember.update({
      where: { roomId_userId: { roomId: params.roomId, userId: params.userId } },
      data: { role: body.role },
      include: { user: { select: { displayName: true, email: true } } },
    });

    return sendSuccess(reply, {
      id: member.id,
      roomId: member.roomId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      user: { displayName: member.user.displayName, email: member.user.email },
    }, 200, buildRequestMeta(request, 'v1'));
  });

  app.delete('/api/v1/rooms/:roomId/members/:userId', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = roomMemberParamsSchema.parse(request.params);
    await requireRoomRole(auth.userId, params.roomId, 'admin');

    await prisma.roomMember.delete({ where: { roomId_userId: { roomId: params.roomId, userId: params.userId } } });
    return sendSuccess(reply, null, 200, buildRequestMeta(request, 'v1'));
  });

  app.post('/api/v1/rooms/:roomId/invites', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = roomIdParamsSchema.parse(request.params);
    const body = generateInviteSchema.parse(request.body);
    await requireRoomRole(auth.userId, params.roomId, 'editor');

    const invite = await prisma.inviteLink.create({
      data: {
        roomId: params.roomId,
        token: buildInviteToken(),
        role: body.role,
        createdBy: auth.userId,
        expiresAt: expiresAtFromPreset(body.expiresIn),
        isSingleUse: body.isSingleUse ?? false,
      },
    });

    return sendSuccess(reply, serializeInvite(invite, options.env.APP_URL), 201, buildRequestMeta(request, 'v1'));
  });

  app.get('/api/v1/rooms/:roomId/invites', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = roomIdParamsSchema.parse(request.params);
    await requireRoomRole(auth.userId, params.roomId, 'editor');

    const invites = await prisma.inviteLink.findMany({
      where: { roomId: params.roomId },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(reply, invites.map((invite) => serializeInvite(invite, options.env.APP_URL)), 200, buildRequestMeta(request, 'v1'));
  });

  app.post('/api/v1/rooms/:roomId/invites/:inviteId/revoke', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = z.object({ roomId: z.string().uuid(), inviteId: z.string().uuid() }).parse(request.params);
    await requireRoomRole(auth.userId, params.roomId, 'editor');

    await prisma.inviteLink.updateMany({ where: { id: params.inviteId, roomId: params.roomId }, data: { isRevoked: true } });
    return sendSuccess(reply, null, 200, buildRequestMeta(request, 'v1'));
  });

  app.post('/api/v1/rooms/:roomId/invites/revoke-all', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = roomIdParamsSchema.parse(request.params);
    await requireRoomRole(auth.userId, params.roomId, 'editor');

    await prisma.inviteLink.updateMany({ where: { roomId: params.roomId, isRevoked: false }, data: { isRevoked: true } });
    return sendSuccess(reply, null, 200, buildRequestMeta(request, 'v1'));
  });

  app.post('/api/v1/join', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const body = inviteJoinSchema.parse(request.body);

    const invite = await prisma.inviteLink.findFirst({
      where: { roomId: body.roomId, token: body.token },
      include: { room: { select: { id: true, passwordHash: true, isDeleted: true } } },
    });

    if (!invite || invite.room.isDeleted || invite.isRevoked || (invite.expiresAt && invite.expiresAt < new Date())) {
      throw new AppError('Invite is invalid or expired', 400, 'BAD_REQUEST');
    }

    if (invite.room.passwordHash) {
      if (!body.password || !(await bcrypt.compare(body.password, invite.room.passwordHash))) {
        throw new AppError('Room password is required or invalid', 403, 'FORBIDDEN');
      }
    }

    await prisma.roomMember.upsert({
      where: { roomId_userId: { roomId: invite.roomId, userId: auth.userId } },
      update: { role: invite.role },
      create: { roomId: invite.roomId, userId: auth.userId, role: invite.role },
    });

    if (invite.isSingleUse) {
      await prisma.inviteLink.update({ where: { id: invite.id }, data: { usedAt: new Date(), isRevoked: true } });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, email: true, displayName: true, avatarUrl: true, emailVerified: true, createdAt: true, updatedAt: true },
    });

    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    return sendSuccess(reply, { user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }, accessToken: (request.headers.authorization ?? '').replace(/^Bearer\s+/i, '') }, 200, buildRequestMeta(request, 'v1'));
  });

  app.get('/api/v1/rooms/:roomId/content', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = roomIdParamsSchema.parse(request.params);
    await requireRoomRole(auth.userId, params.roomId, 'viewer');

    const items = await prisma.contentItem.findMany({
      where: { roomId: params.roomId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(reply, { items: items.map(serializeContentItem), total: items.length, page: 1, perPage: items.length || 1 }, 200, buildRequestMeta(request, 'v1'));
  });

  app.post('/api/v1/rooms/:roomId/content/presign', async (request, reply) => {
    await authenticateRequest(request, options.env);
    const params = roomIdParamsSchema.parse(request.params);
    presignedUrlSchema.parse(request.body);

    const uploadId = randomBytes(16).toString('hex');
    const presignedUrl = `${options.env.APP_URL}/api/v1/uploads?roomId=${params.roomId}&uploadId=${uploadId}`;
    return sendSuccess(reply, { uploadId, presignedUrl, expiresIn: 900 }, 200, buildRequestMeta(request, 'v1'));
  });

  app.post('/api/v1/rooms/:roomId/content', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = roomIdParamsSchema.parse(request.params);
    const body = createContentSchema.parse(request.body);
    await requireRoomRole(auth.userId, params.roomId, 'editor');

    const item = await prisma.contentItem.create({
      data: {
        roomId: params.roomId,
        createdBy: auth.userId,
        type: body.type ?? inferContentType(body.mimeType),
        title: body.title ?? body.filename,
        storageKey: `${params.roomId}/${body.uploadId ?? randomBytes(8).toString('hex')}/${body.filename}`,
        fileSizeBytes: body.fileSizeBytes,
        mimeType: body.mimeType,
        ...(body.metadata !== undefined
          ? { metadata: body.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    return sendSuccess(reply, serializeContentItem(item), 201, buildRequestMeta(request, 'v1'));
  });

  app.get('/api/v1/content/:contentId/download', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = z.object({ contentId: z.string().uuid() }).parse(request.params);

    const item = await prisma.contentItem.findFirst({ where: { id: params.contentId, isDeleted: false } });
    if (!item) throw new AppError('Content not found', 404, 'NOT_FOUND');

    await requireRoomRole(auth.userId, item.roomId, 'viewer');
    return sendSuccess(reply, { downloadUrl: `${options.env.APP_URL}/uploads/${item.storageKey}` }, 200, buildRequestMeta(request, 'v1'));
  });

  app.delete('/api/v1/content/:contentId', async (request, reply) => {
    const auth = await authenticateRequest(request, options.env);
    const params = z.object({ contentId: z.string().uuid() }).parse(request.params);

    const item = await prisma.contentItem.findFirst({ where: { id: params.contentId, isDeleted: false } });
    if (!item) throw new AppError('Content not found', 404, 'NOT_FOUND');

    await requireRoomRole(auth.userId, item.roomId, 'editor');
    await prisma.contentItem.update({ where: { id: params.contentId }, data: { isDeleted: true } });
    return sendSuccess(reply, null, 200, buildRequestMeta(request, 'v1'));
  });
}
