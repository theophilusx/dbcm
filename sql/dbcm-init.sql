-- Script to create DBCM schema and tables

BEGIN;

CREATE ROLE dbcm_user
  WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;

CREATE SCHEMA dbcm AUTHORIZATION dbcm_user;

CREATE TABLE dbcm.change_plans (
    plan_id VARCHAR(22) PRIMARY KEY 
  , applied_dt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  , applied_by VARCHAR(64) NOT NULL  
  , verified_dt TIMESTAMPTZ
  , verified_by VARCHAR(64)  
  , rollback_dt TIMESTAMPTZ 
  , rollback_by VARCHAR(64)
  , plan_name VARCHAR(64) NOT NULL
  , description TEXT
  , status VARCHAR(32)
);

CREATE TABLE dbcm.change_log (
    log_id SERIAL
  , log_dt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  , plan_id VARCHAR(22) NOT NULL
  , plan_name VARCHAR(64) NOT NULL
  , msg TEXT
  , CONSTRAINT change_log_pkey PRIMARY KEY (log_id, plan_id)
);

COMMIT;

