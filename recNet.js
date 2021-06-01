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
        var result = {
            dataObject: [],
            status: 0,
            message: ''
        }
        axios.get(url, {
            validateStatus: function (status) {
                return status < 500; // Reject only if the status code is greater than or equal to 500
            }
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
                console.log('Error');
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
                    console.log('Error', error.message);
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