# Travel Search App

Simple application to compare prices of flights and hotels over a range of dates. Uses the web APIs used in the google flights website.

NOTE: this is a reverse-engineered google flights API, so there is a high chance it will be deprecated / modified in the future.


## Development

Run API server
- node.js API server written in typescript
- runs on port 8000 by default

```
cd api
npm install
npm run start
```

Run client react application
- uses Vite (https://vitejs.dev), runs on port 5173 by default
- has settings for proxy to localhost:8000 for /api endpoints

```
cd client
npm run dev
```

## Deployment

Uses serverless framework (https://www.serverless.com) for deployment to AWS infrastructure.

Demo server : https://afuolvkiag.execute-api.us-east-1.amazonaws.com/



