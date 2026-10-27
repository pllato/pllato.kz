-- Target only the 6,917 records archived in the verified wrong-number rollback.
-- Legitimate archived leads remain in historical conversion statistics.
-- Original rows: incident_20261027_wrong_wa_deals (production backup).
UPDATE deals
SET custom_fields = json_set(CASE WHEN json_valid(custom_fields) THEN custom_fields ELSE '{}' END,
  '$.analyticsExcluded', json('true'),
  '$.analyticsExclusionReason', 'wrong-whatsapp-number-20261027')
WHERE archived_by = 'incident:wrong-wa-number:20261027'
  AND COALESCE(archived, 0) = 1;
