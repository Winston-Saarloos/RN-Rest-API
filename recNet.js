var axios = require("axios");
var FormData = require("form-data");

// Function takes in a RecNet username and returns back user information JSON object
async function getUserInfo(recRoomUsername) {
  // https://accounts.rec.net/account?username=rocko
  var szUrl = "https://accounts.rec.net/account?username=" + recRoomUsername;
  var oUserInfo = await getData(szUrl);
  return oUserInfo;
}

// Function takes in a RecNet Room Name and returns back Room information JSON object
async function getRoomInfo(roomName) {
  // https://accounts.rec.net/account?username=rocko
  var szUrl = `https://rooms.rec.net/rooms/bulk?name=${roomName}`;
  var oRoomInfo = await getData(szUrl);
  return oRoomInfo;
}

async function getEventInfo(eventId) {
  // https://api.rec.net/api/playerevents/v1/${eventId}
  var szUrl = `https://api.rec.net/api/playerevents/v1/${eventId}`;
  var oEventInfo = await getData(szUrl);
  return oEventInfo;
}

async function getBulkUserInfo(collectionOfUserIds) {
  const AMOUNT_PER_BATCH = 50;
  var resultObject = {
    dataObject: [],
    status: 0,
    message: "",
  };

  // break the collection of user IDS into groups of 100
  while (collectionOfUserIds.length > 0) {
    var spliceAmount = 0;
    if (collectionOfUserIds.length > AMOUNT_PER_BATCH) {
      spliceAmount = AMOUNT_PER_BATCH;
    } else {
      spliceAmount = collectionOfUserIds.length;
    }

    var subCollection = collectionOfUserIds.splice(0, spliceAmount);

    // Create the URL
    var szUrl = "https://accounts.rec.net/account/bulk";
    var szParams = "";
    for (var i = 0; i < subCollection.length; i++) {
      if (i === 0) {
        szParams = `?id=${subCollection[i]}`;
      } else {
        szParams += `&id=${subCollection[i]}`;
      }
    }

    var userDataResults = await getData(szUrl + szParams);
    if (userDataResults.status != 200) {
      resultObject.dataObject = [];
      resultObject.status = 400;
      resultObject.message = "An error occured fetching bulk user information.";
      return resultObject;
    }

    resultObject.dataObject = resultObject.dataObject.concat(
      userDataResults.dataObject
    );
  }

  resultObject.status = 200;

  return resultObject;
}

async function getData(url) {
  return new Promise(function (resolve, reject) {
    var result = {
      dataObject: [],
      status: 0,
      message: "",
    };
    axios
      .get(url, {
        validateStatus: function (status) {
          return status < 500; // Reject only if the status code is greater than or equal to 500
        },
      })
      .then(function (response) {
        // handle success
        result.dataObject = response.data;
        result.status = response.status;

        resolve(result);
      })
      .catch(function (error) {
        // handle error
        //console.log(error);
        console.log("Error");
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          //console.log(error.response.data);
          //console.log(error.response.status);
          //console.log(error.response.headers);
          result.data = error.response.data;
          result.status = error.response.status;

          resolve(result);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js

          result.status = -1;

          resolve(result);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
          reject(error.message);
        }
        //console.log(error.config);
      })
      .then(function () {
        // always executed
      });
  });
}

async function getBulkEventInfo(listOfEventIds, url) {
  return new Promise(function (resolve, reject) {
    var formData = new FormData();
    listOfEventIds.forEach((item) => formData.append("ids", item));

    console.log(formData);

    axios({
      method: "post",
      url: url,
      data: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
      .then(function (response) {
        // handle success
        resolve(response.data);
      })
      .catch(function (error) {
        // handle error
        //console.log(error);
        reject(error);
      })
      .then(function () {
        // always executed
      });
  });
}

// Export Lines
module.exports.getUserInfo = getUserInfo;
module.exports.getRoomInfo = getRoomInfo;
module.exports.getEventInfo = getEventInfo;
module.exports.getBulkEventInfo = getBulkEventInfo;
module.exports.getBulkUserInfo = getBulkUserInfo;
module.exports.getData = getData;
