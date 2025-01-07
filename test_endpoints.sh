#!/bin/bash

echo "Testing POST /data endpoint..."
for i in {1..100}; do
   curl -X POST \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"user${i}\", \"email\": \"user${i}@example.com\"}" \
        http://localhost:3000/data
    echo -e "\n"
done


while true; do
  echo "Testing GET /data endpoint..."
  hey -n 10000 -c 50 -m GET http://localhost:3000/data

  echo "Testing GET /error endpoint..."
  hey -n 500 -c 20 http://localhost:3000/error
  echo -e "\n"

  echo "Testing invalid route..."
  hey -n 300 -c 10 http://localhost:3000/invalid
  echo -e "\n"

  echo "Sleeping for 10 seconds before next iteration..."
  sleep 10
done