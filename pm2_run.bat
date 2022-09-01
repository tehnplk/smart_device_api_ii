@echo off
pm2 kill && pm2 start ./bin/www -i 2 -n api-2