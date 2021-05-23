var axios = require("axios");
var FormData = require('form-data');

// Function takes in a RecNet username and returns back user information JSON object
async function getUserInfo(recRoomUsername) {
    // https://accounts.rec.net/account?username=rocko
    var url = 'https://accounts.rec.net/account?username=' + recRoomUsername;
    var userInfo = await getData(url);
    return userInfo;
}

async function getData(url) {
     return new Promise(function (resolve, reject) {
        axios.get(url)
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

async function getBulkEventInfo(listOfEventIds, url) {
    return new Promise(function (resolve, reject) {
        var formData = new FormData();
        listOfEventIds.forEach(item => formData.append("ids", item));

        console.log(formData);

        axios({
            method: 'post',
            url: url,
            data: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
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
module.exports.getBulkEventInfo = getBulkEventInfo;
module.exports.getData = getData;