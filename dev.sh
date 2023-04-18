#/bin/sh

[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm use

cd api
npx pm2 del travel-api
npx pm2 start --name travel-api npm -- start

cd ../client
npm run dev
