#!/bin/sh
set -e

# Cloud Run injects PORT at runtime (default 8080).
# We substitute ONLY ${PORT} so nginx variables like $uri, $uri/ are untouched.
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

echo "nginx configured to listen on port ${PORT}"

exec nginx -g 'daemon off;'
