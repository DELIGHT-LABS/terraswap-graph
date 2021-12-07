#!/bin/bash

count=${1:-1}

function deploy(){

docker build -t delight-labs/terraswap-dashboard .

containers=$(docker ps | grep -c terraswap-dashboard)
echo $containers rename
for (( c=0; c<$containers; c++ )) 
do
    docker rm terraswap-dashboard-${c}-prev
    docker rename terraswap-dashboard-${c} terraswap-dashboard-${c}-prev
    docker stop terraswap-dashboard-${c}-prev
done

for (( c=0; c<$count; c++ ))
do
    docker run --env-file ./.env -it -p 300${c}:3000 --restart always -d --name terraswap-dashboard-${c} delight-labs/terraswap-dashboard	
done

}

deploy $@