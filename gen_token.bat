@echo off
:: Make a GET request to the API
curl -X GET "http://localhost:3000/ipd/gen_hm_token" -H "Content-Type: application/json"

:: Prevent the console window from closing immediately
