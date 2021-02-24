# RN-REST-API
This is used as a middleware API to mirror all RecNet API endpoints.  Currently when I try to access the API from my React-App I receive missing CORS header errors.  The first solution is a reverse proxy to handle the API calls... instead I made a NodeJS Express REST API for mirroring/improving the API calls.  When you try to access an endpoint using the API I make the call from within the app and attatch the required CORS header so my React-App no longer complains.

Temporary test host URL: https://rn-rest-api.herokuapp.com/
