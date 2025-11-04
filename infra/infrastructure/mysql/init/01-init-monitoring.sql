-- Initialize monitoring user for development
-- This creates the MySQL user used by Prometheus mysqld-exporter.
-- See: infra/monitoring/mysqld-exporter/.my.cnf.dev

-- Create user (idempotent on fresh init)
CREATE USER IF NOT EXISTS 'monitoring'@'%' IDENTIFIED BY 'monitoring';
-- Ensure password (harmless if already set)
ALTER USER 'monitoring'@'%' IDENTIFIED BY 'monitoring';

-- Minimal privileges for exporter: process + replication client + read access
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'monitoring'@'%';

-- If you prefer to restrict wider SELECT, you can alternatively grant only performance_schema
-- GRANT SELECT ON performance_schema.* TO 'monitoring'@'%';

FLUSH PRIVILEGES;
