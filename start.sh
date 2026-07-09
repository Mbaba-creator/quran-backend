#!/bin/sh
if [ "" = "production" ]; then
  export DATABASE_URL="postgresql://:@:/quran_platform"
fi
exec node dist/main
