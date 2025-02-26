#!/bin/sh
set -e

echo "🔄 Running DB migrations..."
npx prisma migrate deploy

echo "🌱 Seeding the database..."
npx prisma db seed

echo "🚀 Starting the server..."
exec "$@"
