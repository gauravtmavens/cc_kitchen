#!/bin/bash
/usr/bin/mysqld_safe --skip-grant-tables &
sleep 5
mysql -u root -e "CREATE DATABASE ccremote"
mysql -u root ccremote < /tmp/ccremote.sql