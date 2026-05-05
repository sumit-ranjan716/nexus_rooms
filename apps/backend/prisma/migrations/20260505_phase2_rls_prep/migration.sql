-- Phase 2 RLS preparation scaffold.
-- This migration enables row-level security and creates policies using
-- a request-scoped GUC key: app.current_user_id.
--
-- API layer should set the key per DB session/transaction before queries:
--   SELECT set_config('app.current_user_id', '<uuid>', true);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "room_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invite_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_reset_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_verification_tokens" ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own user row.
DROP POLICY IF EXISTS users_select_self ON "users";
CREATE POLICY users_select_self
ON "users"
FOR SELECT
USING ("id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

DROP POLICY IF EXISTS users_update_self ON "users";
CREATE POLICY users_update_self
ON "users"
FOR UPDATE
USING ("id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
WITH CHECK ("id" = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- Room visibility for members only.
DROP POLICY IF EXISTS rooms_member_select ON "rooms";
CREATE POLICY rooms_member_select
ON "rooms"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM "room_members" rm
    WHERE rm."roomId" = "rooms"."id"
      AND rm."userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  )
);

-- Room updates/deletes only by admin/editor membership.
DROP POLICY IF EXISTS rooms_update_editor_admin ON "rooms";
CREATE POLICY rooms_update_editor_admin
ON "rooms"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM "room_members" rm
    WHERE rm."roomId" = "rooms"."id"
      AND rm."userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
      AND rm."role" IN ('admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "room_members" rm
    WHERE rm."roomId" = "rooms"."id"
      AND rm."userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
      AND rm."role" IN ('admin', 'editor')
  )
);

DROP POLICY IF EXISTS rooms_delete_admin_only ON "rooms";
CREATE POLICY rooms_delete_admin_only
ON "rooms"
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM "room_members" rm
    WHERE rm."roomId" = "rooms"."id"
      AND rm."userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
      AND rm."role" = 'admin'
  )
);

-- Members can read room membership rows for rooms they belong to.
DROP POLICY IF EXISTS room_members_member_select ON "room_members";
CREATE POLICY room_members_member_select
ON "room_members"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM "room_members" rm
    WHERE rm."roomId" = "room_members"."roomId"
      AND rm."userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  )
);

-- Only admin can change membership.
DROP POLICY IF EXISTS room_members_admin_modify ON "room_members";
CREATE POLICY room_members_admin_modify
ON "room_members"
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM "room_members" rm
    WHERE rm."roomId" = "room_members"."roomId"
      AND rm."userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
      AND rm."role" = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "room_members" rm
    WHERE rm."roomId" = "room_members"."roomId"
      AND rm."userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
      AND rm."role" = 'admin'
  )
);

-- Content visibility restricted to room members.
DROP POLICY IF EXISTS content_items_member_select ON "content_items";
CREATE POLICY content_items_member_select
ON "content_items"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM "room_members" rm
    WHERE rm."roomId" = "content_items"."roomId"
      AND rm."userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  )
);

DROP POLICY IF EXISTS content_items_editor_admin_modify ON "content_items";
CREATE POLICY content_items_editor_admin_modify
ON "content_items"
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM "room_members" rm
    WHERE rm."roomId" = "content_items"."roomId"
      AND rm."userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
      AND rm."role" IN ('admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "room_members" rm
    WHERE rm."roomId" = "content_items"."roomId"
      AND rm."userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid
      AND rm."role" IN ('admin', 'editor')
  )
);

-- Auth token/session tables are owner-scoped.
DROP POLICY IF EXISTS refresh_sessions_owner_all ON "refresh_sessions";
CREATE POLICY refresh_sessions_owner_all
ON "refresh_sessions"
FOR ALL
USING ("userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
WITH CHECK ("userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

DROP POLICY IF EXISTS password_reset_tokens_owner_all ON "password_reset_tokens";
CREATE POLICY password_reset_tokens_owner_all
ON "password_reset_tokens"
FOR ALL
USING ("userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
WITH CHECK ("userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

DROP POLICY IF EXISTS email_verification_tokens_owner_all ON "email_verification_tokens";
CREATE POLICY email_verification_tokens_owner_all
ON "email_verification_tokens"
FOR ALL
USING ("userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
WITH CHECK ("userId" = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
