var express = require("express");
var cors = require("cors");
const dotenv = require('dotenv');
dotenv.config();
const {initializeApp, applicaqtionDefault, cert} = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
var moment = require("moment");
const { DateTime, Interval } = require("luxon");
var app = express();
let port = process.env.PORT || 3000;

const serviceAccount = {
  "type": process.env.FIREBASE_ACCOUNT_TYPE,
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY,
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": process.env.FIREBASE_AUTH_URI,
  "token_uri": process.env.FIREBASE_TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
};

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Classes

// RecNet Modules
var recnet = require("./recNet");
var imageHelper = require("./classes/imageHelper");
var accounts = require("./endpoints/accounts");
var images = require("./endpoints/images");
var common = require("./classes/common");
var versionNumber = "0.7.15";

app.use(cors());

app.get("/", (req, res) => {
  common.responseJson(res, [], 200, "API is online! V" + versionNumber);
});

app.get("/firestore/test/", async (req, res) => {
  // https://firebase.google.com/docs/firestore/quickstart?authuser=0&hl=en
  const snapshot = await db.collection('test').get();

  var results = [];
  snapshot.forEach((doc) => {
    results.push({id: doc.id, data: doc.data()})
  });

  common.responseJson(res, results, 200, '');
});

// Takes a player's username or ID and returns back data on the user
app.get("/account/", async (req, res) => {
  accounts.getUserInfoFromUsername(req, res);
  accounts.getUserInfoFromId(req, res);
  accounts.getUserBioFromId(req, res);
});

// Retreives the roles and users who have said roles for a given room
app.get("/room/roles/", async (req, res) => {
  const END_POINT_ADDRESS = "/room/roles/";

  if (req.query.name) {
    var roomData = await recnet.getData(
      `https://rooms.rec.net/rooms?name=${req.query.name}&include=4`
    );

    // create an array of user IDs from the roles list
    var colUserIds = [];
    for (var i = 0; i < roomData.dataObject.Roles.length; i++) {
      colUserIds.push(roomData.dataObject.Roles[i].AccountId);
    }

    var userData = await recnet.getBulkUserInfo(colUserIds);

    if (userData.status != 200) {
      common.responseJson(
        res,
        [],
        405,
        "/room/roles :  An error occured fetching bulk user data."
      );
    }

    var colEnhancedRoles = [];
    for (var i = 0; i < roomData.dataObject.Roles.length; i++) {
      // Loop through each role item

      // Find the user in the user collection
      for (var x = 0; x < userData.dataObject.length; x++) {
        if (
          userData.dataObject[x].accountId ==
          roomData.dataObject.Roles[i].AccountId
        ) {
          colEnhancedRoles.push({
            accountId: userData.dataObject[x].accountId,
            username: userData.dataObject[x].username,
            displayName: userData.dataObject[x].displayName,
            profileImage: userData.dataObject[x].profileImage,
          });
          break;
        }
      }
    }
    roomData.dataObject.Roles = colEnhancedRoles;

    // Return completed data
    res.json(roomData);
  } else {
    common.responseJson(
      res,
      [],
      405,
      END_POINT_ADDRESS & "Room name parameter required."
    );
    return;
  }
});

app.get("/images/global/", async (req, res) => {
    images.getGlobalImages(req, res);
});

// Get request for https://accounts.rec.net/account/bulk
app.get("/bulk/users", async (req, res) => {
  accounts.getBulkAccountsById(req, res);
});

app.get("/bulk/accounts", async (req, res) => {
    accounts.getBulkAccountsById(req, res);
});

// Get request for https://rooms.rec.net/rooms/bulk
app.get("/bulk/rooms", async (req, res) => {
  if (req.query.id) {
    var szUrl = "https://rooms.rec.net/rooms/bulk";
    var szParams = "";

    if (typeof req.query.id == "string") {
      szParams = `?id=${req.query.id}`;
    } else {
      for (var i = 0; i < req.query.id.length; i++) {
        if (i === 0) {
          szParams = `?id=${req.query.id[i]}`;
        } else {
          szParams += `&id=${req.query.id[i]}`;
        }
      }
    }

    var roomData = await recnet.getData(szUrl + szParams);
    res.json(roomData);
  } else if (req.query.name) {
    var oRoomData = await recnet.getRoomInfo(req.query.name);
    res.json(oRoomData);
  } else {
    common.responseJson(
      res,
      [],
      405,
      "/bulk/rooms :  Missing 'ID' or 'Name' parameter."
    );
  }
});

// https://api.rec.net/api/playerevents/v1/bulk
app.get("/events/", async (req, res) => {
  if (req.query.id) {
    var eventData = await recnet.getEventInfo(req.query.id);
    res.json(eventData);
  } else {
    common.responseJson(res, [], 405, "/events :  Missing 'Id' parameter.");
  }
});

app.get("/status/", async (req, res) => {
  const ListOfServers = await recnet.getData("https://ns.rec.net/");
  const keys = Object.keys(ListOfServers.dataObject);
  const ArrayOfServerURIs = keys.map((key) => ({
    Name: key,
    URI: ListOfServers.dataObject[key],
  }));

  const serverFieldList = [];
  await Promise.all(
    ArrayOfServerURIs.map(async (server) => {
      if (server.Name !== "CDN") {
        var serverStatus = await recnet.getData(server.URI + "/health");
        var serverStatusCode = serverStatus.status;

        serverFieldList.push({
          name: server.Name == "WWW" ? "Website (rec.net)" : server.Name,
          uri: server.URI,
          statusCode: serverStatusCode,
          status: serverStatus.DataObject,
        });
      }
    })
  );

  res.json(serverFieldList);
});

app.get("/images/", async (req, res) => {
    images.ImagesV1(req, res);
});

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});
