var express = require("express");
var axios = require("axios");
var cors = require('cors');
var moment = require('moment');
var app = express();
let port = process.env.PORT || 3000;

// RecNet Modules
var recnet = require('./recNet');

app.use(cors())

app.get("/", (req, res) => {
    res.send("RN-ExtraTools.com API is online!");
});

// Takes a player's username or ID and returns back data on the user
app.get("/account/", (req, res) => {
    if (req.query.u) { // ?u={username}
        var url = 'https://accounts.rec.net/account?username=' + req.query.u;
        axios.get(url)
            .then(response => {
                res.json(response.data);
            });
    } else if (req.query.id) { // ?id={playerId}
        var url = 'https://accounts.rec.net/account/' + req.query.id;
        axios.get(url)
            .then(response => {
                res.json(response.data);
            });
    } else if (req.query.bio) { // ?bio={playerId}
        var url = 'https://accounts.rec.net/account/' + req.query.bio + '/bio';
        axios.get(url)
            .then(response => {
                res.json(response.data);
            });
    }
});

app.get("/images/global/", async (req, res) => {
    // Possible Parameters
    // - Date
    // - Take
    
    const END_POINT_ADDRESS = '/images/global : '
    if (req.query.take || req.query.date) {
        var dtToday = moment().format();
        var iReturnAmount = 2000;
        if (req.query.take) {
            var iTake = parseInt(req.query.take)
            if (iTake > 0) {iReturnAmount = iTake}
        }

        var date = 0;
        if (req.query.date) {
            date = moment(new Date(req.query.date)).format();
        }

        if (date < dtToday) { // This date isnt working correctly.. but the take is working fine
            dtToday = date
        }

        var szUrl = 'https://api.rec.net/api/images/v3/feed/global?skip=0&take=' + iReturnAmount + '&since=' + dtToday
        var oGlobalData = await recnet.getData(szUrl);
        res.json(oGlobalData);
    
    } else {
        res.send(END_POINT_ADDRESS & "Supplied parameter is not permitted.");
        return;
    }
});

app.get("/images/", async (req, res) => {

    // List of possible query parameters (This should probably become request JSON eventually)
    // 
    // - Type [0-3]
    // - Filter [String]
    // - Sort [String]
    // - uid [integer]
    // - u [username]


    // console.log(req.query);
    const END_POINT_ADDRESS = '/images/ : '
    var userInfoObject;
    var accountId;

    if (req.query.u && req.query.uid) {
        res.send(END_POINT_ADDRESS & "Only username OR user ID can be supplied.");
        return;
    }

    if (req.query.u) { // ?u={username}
        // TODO ADD VALIDATION TO MAKE SURE THIS HAS A MAX LENGTH
        console.log("Looking up user ID..");
        userInfoObject = await recnet.getUserInfo(req.query.u);
        accountId = userInfoObject.accountId;

    } else if (req.query.uid) { // ?uid={username}
        console.log("User ID supplied..");
        accountId = parseInt(req.query.uid);

        if (accountId != req.query.uid) {
            res.send(END_POINT_ADDRESS + 'UID value must be an integer value.');
            return;
        }
    
        if (accountId <= 0) {
            res.send(END_POINT_ADDRESS + 'UID value must be greater than 0.');
            return;
        }
    }

    if (accountId >= 1) { // types 1 and 2 should be evaluated in here
        var url = 'https://api.rec.net/api/images/v4/player/' + accountId; // Default if type is not provided
        if (req.query.type) {
            var type = parseInt(req.query.type);

            if (type != req.query.type) {
                res.send(END_POINT_ADDRESS + 'Type value must be an integer value [0-2].');
                return;
            }

            switch (type) {
                case 0: // Global
                    url = '';
                    break;
                case 1: // User Feed
                    url = '';
                    break;
                case 2: // User Library
                    url = '';
                    break;
            }
        }


        // type 0 should be evaluated above.  If type 0 then set accountId = -1

        // var dtToday = moment().format();
        // var urlUserPhotos = 'https://api.rec.net/api/images/v4/player/' + userId + '?skip=0&take=100000';
        // var urlUserFeed = 'https://api.rec.net/api/images/v3/feed/player/' + userId + '?skip=0&take=100000';
        // var urlGlobalFeed = 'https://api.rec.net/api/images/v3/feed/global?skip=0&take=3000&since=' + dtToday;


        var imageData = await recnet.getData(url);
        res.json(imageData);
    }
    // if (req.query.type) { // ?type={username}
});


// Takes in various criteria and returns a set of image results from a user's profile

// Image Locations: Global, User Feed, User Library

// Filter Criteria: 
// Activity:    A:GoldenTrophy or A!:GoldenTrophy
// User:        U:Rocko or U!:Rocko
// Date:        D:1/13/2021
// Date-Range:  DR:1/1/2021-1/5/2021

// Sorts
// Cheers {ASC}
// Cheers {DSC}
// Comments {ASC}
// Comments {DSC}
// Date Taken {ASC} (Default)
// Date Taken {DESC}

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});

// Example Filter String: A:GoldenTrophy|U:Rocko