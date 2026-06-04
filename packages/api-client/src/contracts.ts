import { z } from 'zod';

const apiMetaSchema = z.object({
  requestId: z.string().optional(),
  timestamp: z.string().optional(),
  version: z.string().optional(),
});

const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
    timestamp: z.string(),
  }),
});

const apiSuccessEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: apiMetaSchema.optional(),
  });

export const healthResponseSchema = apiSuccessEnvelope(
  z.object({
    status: z.literal('ok'),
    version: z.string(),
    timestamp: z.string(),
    uptime: z.number().optional(),
  })
);

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const roomSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  hasPassword: z.boolean(),
  createdBy: z.string(),
  memberCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const roomMemberSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  userId: z.string(),
  role: z.enum(['admin', 'editor', 'viewer']),
  joinedAt: z.string(),
  user: z
    .object({
      displayName: z.string().nullable(),
      email: z.string().email(),
    })
    .optional(),
});

const inviteLinkSchema = z.object({
  id: z.string(),
  token: z.string(),
  url: z.string().url(),
  role: z.enum(['admin', 'editor', 'viewer']),
  expiresAt: z.string().nullable(),
  isSingleUse: z.boolean(),
  isRevoked: z.boolean(),
  usedAt: z.string().nullable(),
  createdAt: z.string(),
});

const contentItemSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  type: z.enum(['pdf', 'image', 'document', 'link', 'text']),
  title: z.string(),
  fileSizeBytes: z.number(),
  mimeType: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const signupResponseSchema = apiSuccessEnvelope(
  z.object({
    user: userSchema,
    message: z.string(),
    verificationRequired: z.literal(true),
  })
);

export const authSessionResponseSchema = apiSuccessEnvelope(
  z.object({
    user: userSchema,
    accessToken: z.string(),
  })
);

export const authMessageResponseSchema = apiSuccessEnvelope(
  z.object({
    message: z.string(),
  })
);

export const currentUserResponseSchema = apiSuccessEnvelope(
  z.object({
    user: userSchema,
    session: z.object({
      sessionId: z.string(),
      expiresAt: z.string(),
    }),
  })
);

export const roomResponseSchema = apiSuccessEnvelope(roomSchema);
export const roomsResponseSchema = apiSuccessEnvelope(z.array(roomSchema));
export const roomMembersResponseSchema = apiSuccessEnvelope(z.array(roomMemberSchema));
export const roomMemberResponseSchema = apiSuccessEnvelope(roomMemberSchema);
export const inviteLinkResponseSchema = apiSuccessEnvelope(inviteLinkSchema);
export const inviteLinksResponseSchema = apiSuccessEnvelope(z.array(inviteLinkSchema));
export const contentItemResponseSchema = apiSuccessEnvelope(contentItemSchema);
export const contentItemsResponseSchema = apiSuccessEnvelope(
  z.object({
    items: z.array(contentItemSchema),
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
  })
);
export const presignedUrlResponseSchema = apiSuccessEnvelope(
  z.object({
    uploadId: z.string(),
    presignedUrl: z.string().url(),
    expiresIn: z.number(),
  })
);
export const downloadUrlResponseSchema = apiSuccessEnvelope(
  z.object({
    downloadUrl: z.string().url(),
  })
);
export const emptyResponseSchema = apiSuccessEnvelope(z.null());

// Expanded schemas
const folderSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  parentId: z.string().nullable(),
  name: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const tagSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  name: z.string(),
  color: z.string(),
  createdAt: z.string(),
});

const baseCommentSchema = z.object({
  id: z.string(),
  contentItemId: z.string(),
  parentId: z.string().nullable(),
  authorId: z.string(),
  author: z
    .object({
      displayName: z.string().nullable(),
      email: z.string().email(),
    })
    .optional(),
  body: z.string(),
  isEdited: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type CommentSchemaType = z.infer<typeof baseCommentSchema> & {
  replies?: CommentSchemaType[];
};

const commentSchema: z.ZodType<CommentSchemaType> = baseCommentSchema.extend({
  replies: z.lazy(() => z.array(commentSchema)).optional(),
});

const contentVersionSchema = z.object({
  id: z.string(),
  contentItemId: z.string(),
  versionNumber: z.number(),
  storageKey: z.string(),
  snapshot: z.unknown().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  changeSummary: z.string().nullable(),
  creator: z
    .object({
      displayName: z.string().nullable(),
    })
    .optional(),
});

const activityLogSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  actorId: z.string(),
  actor: z
    .object({
      displayName: z.string().nullable(),
    })
    .optional(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  metadata: z.unknown().optional(),
  createdAt: z.string(),
});

export const folderResponseSchema = apiSuccessEnvelope(folderSchema);
export const foldersResponseSchema = apiSuccessEnvelope(z.array(folderSchema));
export const tagResponseSchema = apiSuccessEnvelope(tagSchema);
export const tagsResponseSchema = apiSuccessEnvelope(z.array(tagSchema));
export const commentResponseSchema = apiSuccessEnvelope(commentSchema);
export const commentsResponseSchema = apiSuccessEnvelope(z.array(commentSchema));
export const contentVersionResponseSchema = apiSuccessEnvelope(contentVersionSchema);
export const versionsResponseSchema = apiSuccessEnvelope(z.array(contentVersionSchema));
export const activityLogResponseSchema = apiSuccessEnvelope(z.array(activityLogSchema));

const inviteDetailsSchema = z.object({
  roomId: z.string().uuid(),
  roomName: z.string(),
  roomDescription: z.string().nullable(),
  hasPassword: z.boolean(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export const inviteDetailsResponseSchema = apiSuccessEnvelope(inviteDetailsSchema);
export const joinDirectResponseSchema = apiSuccessEnvelope(
  z.object({
    roomId: z.string().uuid(),
    status: z.enum(['approved', 'pending']),
  })
);

const roomLookupSchema = z.object({
  roomId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  hasPassword: z.boolean(),
  isApprovalRequired: z.boolean(),
  membershipStatus: z.enum(['not_member', 'member', 'pending_approval']),
});

export const roomLookupResponseSchema = apiSuccessEnvelope(roomLookupSchema);

const joinRequestSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.string(),
  createdAt: z.string(),
  user: z
    .object({
      displayName: z.string().nullable(),
      email: z.string().email(),
    })
    .optional(),
});

export const joinRequestsResponseSchema = apiSuccessEnvelope(z.array(joinRequestSchema));

export const requestSchemas = {
  login: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  signup: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(1).max(120),
  }),
  createRoom: z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    password: z.string().min(8).optional(),
    isApprovalRequired: z.boolean().optional(),
  }),
  updateRoom: z.object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(500).optional(),
  }),
  generateInviteLink: z.object({
    role: z.enum(['admin', 'editor', 'viewer']),
    expiresIn: z.enum(['24h', '7d', '30d', 'never']),
    isSingleUse: z.boolean().optional(),
  }),
  presignedUrl: z.object({
    filename: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(255),
    fileSizeBytes: z.number().int().positive(),
  }),
  createContent: z.object({
    uploadId: z.string().min(1).optional(),
    filename: z.string().min(1).max(255),
    title: z.string().min(1).max(255).optional(),
    mimeType: z.string().min(1).max(255),
    fileSizeBytes: z.number().int().positive(),
    folderId: z.string().uuid().nullable().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
  }),
  joinRoom: z.object({
    roomId: z.string().uuid(),
    token: z.string().min(1),
    password: z.string().min(8).optional(),
    createAccount: z.boolean().optional(),
  }),
  verifyEmail: z.object({
    token: z.string().min(1),
  }),
  forgotPassword: z.object({
    email: z.string().email(),
  }),
  resetPassword: z.object({
    token: z.string().min(1),
    password: z.string().min(8),
  }),
  createFolder: z.object({
    name: z.string().min(1).max(120),
    parentId: z.string().uuid().nullable().optional(),
  }),
  createTag: z.object({
    name: z.string().min(1).max(50),
    color: z.string().min(1).max(20),
  }),
  createComment: z.object({
    body: z.string().min(1),
    parentId: z.string().uuid().nullable().optional(),
  }),
};

export const responseSchemas = {
  apiErrorSchema,
  health: healthResponseSchema,
  signup: signupResponseSchema,
  auth: authSessionResponseSchema,
  authMessage: authMessageResponseSchema,
  currentUser: currentUserResponseSchema,
  room: roomResponseSchema,
  rooms: roomsResponseSchema,
  roomMembers: roomMembersResponseSchema,
  roomMember: roomMemberResponseSchema,
  inviteLink: inviteLinkResponseSchema,
  inviteLinks: inviteLinksResponseSchema,
  contentItem: contentItemResponseSchema,
  contentItems: contentItemsResponseSchema,
  presignedUrl: presignedUrlResponseSchema,
  downloadUrl: downloadUrlResponseSchema,
  empty: emptyResponseSchema,
  folder: folderResponseSchema,
  folders: foldersResponseSchema,
  tag: tagResponseSchema,
  tags: tagsResponseSchema,
  comment: commentResponseSchema,
  comments: commentsResponseSchema,
  version: contentVersionResponseSchema,
  versions: versionsResponseSchema,
  activityLog: activityLogResponseSchema,
  contentItemsList: apiSuccessEnvelope(z.array(contentItemSchema)),
  inviteDetails: inviteDetailsResponseSchema,
  joinDirect: joinDirectResponseSchema,
  roomLookup: roomLookupResponseSchema,
  joinRequests: joinRequestsResponseSchema,
};

export type ApiResponseSchema = typeof responseSchemas;
