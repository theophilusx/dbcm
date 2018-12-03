#!/bin/bash

# Very simple script to initialise DBCM
echo "Configure DBCM"
echo ""
read -p "Database Name: " PGDATABASE
read -p "Host: " PGHOST
read -p "DB Port: " PGPORT
read -p "DB User: " PGUSER
echo ""
echo "Setup DBCM for database ${PGDATABASE} on host ${PGHOST}:${PGPORT} using user ${PGUSER}"
echo ""
read -p "Is this correct? [y/n]: " CONFIRM

if [[ "${CONFIRM}" == "y" || "${CONFIRM}" == "Y" ]]; then
    echo "Setting up DBCM"
    psql -f ../sql/dbcm-init.sql -U ${PGUSER} -h ${PGHOST} -p ${PGPORT} ${PGDATABASE}
    psql -c "GRANT dbcm_user to ${PGUSER}" -h ${PGHOST} -p ${PGPORT} ${PGDATABASE}
else
    echo "Cancelling setup"
    exit -1
fi


