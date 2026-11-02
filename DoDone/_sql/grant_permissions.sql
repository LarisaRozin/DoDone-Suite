-- Run this script as PostgreSQL superuser (postgres) to grant necessary permissions to dodone_user
-- Example: psql -h localhost -p 5432 -U postgres -d dodone -f grant_permissions.sql

-- Grant necessary privileges to dodone_user for managing indexes and tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dodone_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dodone_user;
GRANT CREATE ON SCHEMA public TO dodone_user;

-- Change ownership of existing objects to dodone_user
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Change ownership of all tables
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO dodone_user';
    END LOOP;
    
    -- Change ownership of all indexes
    FOR r IN SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'ALTER INDEX public.' || quote_ident(r.indexname) || ' OWNER TO dodone_user';
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not change ownership of index %: %', r.indexname, SQLERRM;
        END;
    END LOOP;
    
    -- Change ownership of all sequences
    FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.sequence_name) || ' OWNER TO dodone_user';
    END LOOP;
END
$$;

-- Grant default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dodone_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dodone_user;

-- Verify the index situation
SELECT 
    schemaname,
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'AllowanceHistories'
ORDER BY indexname;