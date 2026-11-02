-- Migration: Add FailedWebhookNotification table for handling webhook retry queue
-- Date: 2026-01-25
-- Description: Stores failed webhook notifications for retry to handle race conditions
--              where webhooks arrive before subscription verification

CREATE TABLE IF NOT EXISTS "FailedWebhookNotifications" (
    "Id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "Platform" varchar(20) NOT NULL,
    "Payload" text NOT NULL,
    "PurchaseToken" varchar(1000),
    "ProductId" varchar(100),
    "NotificationType" integer,
    "FailureReason" varchar(500),
    "RetryCount" integer NOT NULL DEFAULT 0,
    "MaxRetries" integer NOT NULL DEFAULT 10,
    "CreatedAt" timestamptz NOT NULL,
    "LastRetryAt" timestamptz,
    "NextRetryAt" timestamptz NOT NULL,
    "IsProcessed" boolean NOT NULL DEFAULT false,
    "ProcessedAt" timestamptz,
    "IsAbandoned" boolean NOT NULL DEFAULT false,
    "AbandonedAt" timestamptz
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "IX_FailedWebhookNotifications_PurchaseToken" 
    ON "FailedWebhookNotifications" ("PurchaseToken");

CREATE INDEX IF NOT EXISTS "IX_FailedWebhookNotifications_Retry_Status" 
    ON "FailedWebhookNotifications" ("IsProcessed", "IsAbandoned", "NextRetryAt");

-- Add comments for documentation
COMMENT ON TABLE "FailedWebhookNotifications" IS 'Stores webhook notifications that failed to process for retry';
COMMENT ON COLUMN "FailedWebhookNotifications"."Platform" IS 'Platform that sent the webhook (google-play or apple)';
COMMENT ON COLUMN "FailedWebhookNotifications"."Payload" IS 'The raw webhook payload (JSON)';
COMMENT ON COLUMN "FailedWebhookNotifications"."RetryCount" IS 'Number of times we have attempted to process this notification';
COMMENT ON COLUMN "FailedWebhookNotifications"."NextRetryAt" IS 'When we should next attempt to process this notification';
