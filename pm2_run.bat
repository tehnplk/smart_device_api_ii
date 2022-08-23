@echo off
pm2 kill && pm2 start ./bin/www -i 4 --name smart_connect_api