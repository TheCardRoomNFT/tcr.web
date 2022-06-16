
# thecardroom.io

## Setup
    - npm install
    - npm run build
    - DEBUG=thecardroom:* npm run devstart

## Notes
    - https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04

## Updating the server
    ssh -i key user@ip
    /home/nodejs/workspace/tcr.web
    git pull
    npm run build
    su - nodejs
    pm2 restart www
    pm2 log
    pm2 list
    
