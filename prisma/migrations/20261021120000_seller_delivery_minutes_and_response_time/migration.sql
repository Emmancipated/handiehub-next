-- Store delivery estimates canonically in minutes so sellers can express them
-- in minutes, hours, or days. Existing rows were entered in days.
ALTER TABLE "SellerProfile"
  RENAME COLUMN "intraStateDeliveryMinDays" TO "intraStateDeliveryMinMinutes";
ALTER TABLE "SellerProfile"
  RENAME COLUMN "intraStateDeliveryMaxDays" TO "intraStateDeliveryMaxMinutes";
ALTER TABLE "SellerProfile"
  RENAME COLUMN "interStateDeliveryMinDays" TO "interStateDeliveryMinMinutes";
ALTER TABLE "SellerProfile"
  RENAME COLUMN "interStateDeliveryMaxDays" TO "interStateDeliveryMaxMinutes";

UPDATE "SellerProfile"
SET
  "intraStateDeliveryMinMinutes" = "intraStateDeliveryMinMinutes" * 1440,
  "intraStateDeliveryMaxMinutes" = "intraStateDeliveryMaxMinutes" * 1440,
  "interStateDeliveryMinMinutes" = "interStateDeliveryMinMinutes" * 1440,
  "interStateDeliveryMaxMinutes" = "interStateDeliveryMaxMinutes" * 1440
WHERE
  "intraStateDeliveryMinMinutes" IS NOT NULL
  OR "intraStateDeliveryMaxMinutes" IS NOT NULL
  OR "interStateDeliveryMinMinutes" IS NOT NULL
  OR "interStateDeliveryMaxMinutes" IS NOT NULL;

-- Normalise the common free-text response times that existed before the field
-- became an enum. Unrecognised values are left untouched so no seller loses
-- information; the API treats them as unset.
UPDATE "SellerProfile"
SET "responseTime" = CASE LOWER(TRIM("responseTime"))
  WHEN '1 hour' THEN 'WITHIN_1_HOUR'
  WHEN 'within 1 hour' THEN 'WITHIN_1_HOUR'
  WHEN '2 hours' THEN 'WITHIN_2_HOURS'
  WHEN 'within 2 hours' THEN 'WITHIN_2_HOURS'
  WHEN '4 hours' THEN 'WITHIN_4_HOURS'
  WHEN 'within 4 hours' THEN 'WITHIN_4_HOURS'
  WHEN '8 hours' THEN 'WITHIN_8_HOURS'
  WHEN 'within 8 hours' THEN 'WITHIN_8_HOURS'
  WHEN '1 day' THEN 'WITHIN_24_HOURS'
  WHEN 'within 1 day' THEN 'WITHIN_24_HOURS'
  WHEN '24 hours' THEN 'WITHIN_24_HOURS'
  WHEN 'within 24 hours' THEN 'WITHIN_24_HOURS'
  WHEN '2 days' THEN 'WITHIN_2_DAYS'
  WHEN 'within 2 days' THEN 'WITHIN_2_DAYS'
  WHEN '3 days' THEN 'WITHIN_3_DAYS'
  WHEN 'within 3 days' THEN 'WITHIN_3_DAYS'
  WHEN '1 week' THEN 'WITHIN_1_WEEK'
  WHEN 'within 1 week' THEN 'WITHIN_1_WEEK'
  WHEN '7 days' THEN 'WITHIN_1_WEEK'
  WHEN 'within 7 days' THEN 'WITHIN_1_WEEK'
  ELSE "responseTime"
END
WHERE "responseTime" IS NOT NULL;
