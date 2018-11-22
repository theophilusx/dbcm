# dbcm - Database Change Management

A very basic database change management application used to encourage
maintenance of database structure definitions with version control. 

## Objectives

- Use version control to manage database DDL statements.
- Exclude data change management - leave data management to the database.
- Provide a way to track what changes have been applied to a database structure
- Provide a way to promote or rollback changes made to a database

The general idea is to use Git to track changes made to database definitions
(tables, views, functions, triggers, schemas, roles etc). This is not about
managing data stored in the database. There are several data migration tools
which can assist with that. The focus here is on the database structure. At any
time, we should be able to interogate a database and know exactly which changes
have been applied, when they were applied and any outstanding changes waiting to
be applied. It should also be possible to rollback a change and verify changes
have been applied successfully. 

At this stage, the focus is on Postgresql. Other RDBMS may be considered in the
future. 

## Status

Right now, this is just *vapourware* - an idea waiting to be given form.

## Architecture and Requirements

For each *change*, maintain 3 files:

- update.sql :: An SQL script which will perform the change
- validate.sql :: An SQL script which is able to verify the change was
  successfully applied
- rollback.sql :: A script which can roll back the change and return the
  database structure to the previous state

The above 3 files make up a *change set*. A plan file will be maintained which
lists the change sets and determines the order changes need to be
applied. Rolling back a change will roll back all changes performed since the
change being targeted for rollback. Changes cannot be applied unless all changes
which precede it have been applied. Every change requires a *friendly* name as
well as some means of uniquely identifying the change. 

Each database under change management will also have a *dbcm* schema, which will
hold database change management tables used to record metadata about changes. It
is these tables which will be interrogated to determine the current database
state. It should also be possible to get a complete log of changes and rollbacks
for a specific database. 

It should be possible to associate multiple databases with a specific repository
i.e. dev, uat and prod instances. It should also be possible to bundle up
changes into a script which can be applied without requiring any other tools. 






