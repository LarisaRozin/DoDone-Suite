-- Query to check if the unique index exists
-- Run this with: psql -h localhost -p 5432 -U dodone_user -d dodone -f check_indexes.sql

SELECT 
    schemaname,
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'AllowanceHistories'
ORDER BY indexname;

-- Also check index usage and constraints
SELECT 
    i.relname as index_name,
    t.relname as table_name,
    a.attname as column_name,
    ix.indisunique as is_unique,
    ix.indisprimary as is_primary
FROM 
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a
WHERE 
    t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relname = 'AllowanceHistories'
ORDER BY t.relname, i.relname;