var axios = require("axios");

// Function takes in a RecNet username and returns back user information JSON object
async function getUserInfo(recRoomUsername) {
    var url = 'https://accounts.rec.net/account?username=' + recRoomUsername;
    
    return new Promise(function (resolve, reject) {

        // https://accounts.rec.net/account?username=rocko
        axios.get(url)
            .then(function (response) {
                // handle success
                resolve(response.data);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
                reject(error);
            })
            .then(function () {
                // always executed
            });
    });
}

module.exports.getUserInfo = getUserInfo;