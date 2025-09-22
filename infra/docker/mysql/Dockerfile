# syntax=docker/dockerfile:1.7
FROM mysql:9.4

# Provide a default custom configuration to keep UTF-8 consistent across environments.
COPY infra/docker/mysql/my.cnf /etc/mysql/conf.d/my.cnf
