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

Still very much under active development. However, some significant progress has
been achieved. The current version provides a basic terminal/text based
interface which enables 

- Defining of git repository to be used to track database changes. Expects the
  git server to be configured to support ssh access. To start, create a bare git
  repository and note the ssh URL to access it. When you first run the program,
  it will prompt you for the necessary details and then will configure the
  repository for use as a DB change tracking system.
- Defining database targets. The DB target is where changes will be
  applied. Each repository can support multiple targets i.e. dev, uat and prod
- Defining new change plan. A change plan consists of 3 files, each of which is
  an SQL script. The application will setup stub scripts for each of the 3
  scripts. The scripts are changes (e.g. DDL statements), verify (e.g. SQL to
  verify changes have been applied successfully) and rollback, a script that
  will undo/remove the changes implemented by the change script
- The application will open the preferred edito to edit the scripts. This is
  currently only supported on OSX. Other platforms will be added.
- The first time you run the application, it will ask a number of configuration
  questions. This information is stored in either a personal .dbcmrc file in the
  user's home directory or in configuration files within each repository. 
- When defining a repository, you are asked about approval process. Changes can
  either be unapproved, require approval from at least one person on a list of
  approvers or require approval from all members on the approval list. Youa re
  prompted for the names of approvers when setting up a new repository.
- Applying of chabnges and verifying them is support3ed
- ROllback of changes is partially supported (WIP). 
- Listing of changes applied to a target is implemented

This application is still not ready for production use, but it is getting
closer! There should be sufficient functionality to give a taste of what it will
eventually do. At present, the interface is very basic and text based. Once the
basic functionality is all working, a GUI will be added (possibly using
Electron). 


## Usage

### Pre-requisites 

1. Nodejs v8.x
2. Git and libgit installed
3. A remote git repository server e.g. github, gitlab etc. with SSH access
4. Postgres database server (local or remote)
5. Locally installed psql

### Installation

1. Clone this repo somewhere
2. In the root of the repository, run 

````
npm install
````

then, from the root of the repository, run

````
node src/index.js
````

and see what doesn't work! There are still lots of bugs and error handling is
very primitive. 

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






