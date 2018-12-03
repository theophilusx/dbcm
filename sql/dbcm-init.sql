-- Script to create DBCM schema and tables

BEGIN;

CREATE ROLE dbcm_user
  WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;

CREATE SCHEMA dbcm AUTHORIZATION dbcm_user;

CREATE TYPE change_status AS ENUM ('applied', 'verified', 'rolledback', 'invalid', 'unknown');

CREATE TABLE dbcm.change_sets (
    set_id VARCHAR(22) PRIMARY KEY 
  , applied_dt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  , applied_by VARCHAR(63) NOT NULL  
  , verified_dt TIMESTAMPTZ
  , verified_by VARCHAR(63)  
  , rollback_dt TIMESTAMPTZ 
  , rollback_by VARCHAR(63)
  , set_name VARCHAR(64) NOT NULL
  , description TEXT
  , status change_status
);

CREATE TABLE dbcm.change_log (
    log_id SERIAL
  , log_dt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  , set_id VARCHAR(22) NOT NULL
  , set_name VARCHAR(64) NOT NULL
  , msg TEXT
  , CONSTRAINT change_log_pkey PRIMARY KEY (log_id, set_id)
);

COMMIT;

