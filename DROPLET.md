# Droplet Maintenance

## Connecting to Droplet:

`ssh shawarmahash` or `ssh -i ~/.ssh/id_rsa deploy@165.22.159.76`

## Updating code

`cd /app`

`git pull`

`docker compose up -d --build`