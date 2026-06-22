-- Mark every call from the admin desk account as Fueled (house book).
-- Safe to re-run: only updates rows still flagged as member calls.

UPDATE calls c
SET is_fueled = true
FROM users u
WHERE c.user_id = u.id
  AND u.role = 'admin'
  AND c.is_fueled = false;

-- Optional: inspect open admin calls missing research snapshots
-- SELECT c.id, c.symbol, c.called_at
-- FROM calls c
-- JOIN users u ON u.id = c.user_id AND u.role = 'admin'
-- LEFT JOIN call_research_snapshots r ON r.call_id = c.id
-- WHERE r.call_id IS NULL
-- ORDER BY c.called_at DESC;
