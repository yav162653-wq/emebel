\getenv app_password EMEBEL_APP_PASSWORD
\getenv migrator_password EMEBEL_MIGRATOR_PASSWORD
\getenv database_name POSTGRES_DB

CREATE ROLE emebel_app
  LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;

CREATE ROLE emebel_migrator
  LOGIN PASSWORD :'migrator_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT;

ALTER DATABASE :"database_name" OWNER TO emebel_migrator;
ALTER SCHEMA public OWNER TO emebel_migrator;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO emebel_app;
GRANT CONNECT ON DATABASE :"database_name" TO emebel_app, emebel_migrator;
