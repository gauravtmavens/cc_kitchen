FROM mysql:5.7


# ADD ccremote.sql /tmp/ccremote.sql

# ADD ccremote.sql /docker-entrypoint-initdb.d

# RUN /bin/bash -c "/usr/bin/mysqld_safe --skip-grant-tables &" && \
#   sleep 5 && \
#   mysql -u root -p root_password -e "CREATE DATABASE ccremote" && \
#   mysql -u root ccremote < /tmp/ccremote.sql



# ADD dump.sql /docker-entrypoint-initdb.d

# ADD ccremote.sql /tmp/ccremote.sql

# RUN /bin/bash -c "/usr/bin/mysqld_safe --skip-grant-tables &" && \
#   sleep 5 && \
#   mysql -u root -e "CREATE DATABASE ccremote" && \
#   mysql -u root ccremote < /tmp/ccremote.sql




# CMD docker exec -i nodelogin mysql -uroot -proot_password ccremote < db/ccremote.sql



# ENV MYSQL_DATA_DIR=/var/lib/mysql \
#     MYSQL_RUN_DIR=/run/mysqld \
#     MYSQL_LOG_DIR=/var/log/mysql

# ADD ["ccremote.sql", "/tmp/ccremote.sql"]

# RUN /etc/init.d/mysql start && \
#          mysql -u root -p$MYSQL_ROOT_PASSWORD  -e "GRANT ALL PRIVILEGES ON *.* TO 'kgaurav'@'%' IDENTIFIED BY 'password';FLUSH PRIVILEGES;" && \
#         mysql -u root -p${MYSQL_ROOT_PASSWORD}  < /tmp/ccremote.sql








