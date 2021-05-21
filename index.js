var express = require("express");
var cors = require('cors');
//var bodyParser = require('body-parser');
var moment = require('moment');
var app = express();
let port = process.env.PORT || 3000;

// Classes

// RecNet Modules
var recnet = require('./recNet');
var versionNumber = '0.0.9'

app.use(cors());

app.get("/", (req, res) => {
    res.send("RN-ExtraTools.com API is online! V" + versionNumber);
});

// Takes a player's username or ID and returns back data on the user
app.get("/account/", async (req, res) => {
    var data = {};
    if (req.query.u) { // ?u={username}
        var url = 'https://accounts.rec.net/account?username=' + req.query.u;
        data = await recnet.getData(url)
        res.json(data);

    } else if (req.query.id) { // ?id={playerId}
        var url = 'https://accounts.rec.net/account/' + req.query.id;
        data = await recnet.getData(url)
        res.json(data);

    } else if (req.query.bio) { // ?bio={playerId}
        var url = 'https://accounts.rec.net/account/' + req.query.bio + '/bio';
        data = await recnet.getData(url)
        res.json(data);
    }
});

app.get("/images/global/", async (req, res) => {
    //Possible Parameters
    //- Date
    //- Take

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
    // - take [integer]
    // - skip [integer]


    // console.log(req.query);
    const END_POINT_ADDRESS = '/images/ : ';
    const MAX_RETURN_NUMBER = 100000;
    var userInfoObject;
    var accountId = 0;
    var takeAmount = MAX_RETURN_NUMBER; // Default Values
    var skipAmount = 0;
    var url = '';

    // ?take={integer}
    if (req.query.take) {
        takeAmount = req.query.take;

        if (takeAmount > MAX_RETURN_NUMBER) {
            takeAmount = MAX_RETURN_NUMBER;
        }
    }

    // ?skip={integer}
    if (req.query.skip) {
        skipAmount = req.query.skip;
    }

    if (req.query.type) {
        var type = parseInt(req.query.type);
        // Should verify it parses correctly..

        if (type == 1 || type == 2) { // Photo Feed or User Photo Library Types

            // You cannot provide both 'u' and 'uid' parameter arguments
            if (req.query.u && req.query.uid) {
                res.send(END_POINT_ADDRESS & "Only username OR user ID can be supplied.");
                return;
            }

            if (!req.query.u && !req.query.uid) {
                res.send("A username or user ID must be provided with type 1 and 2 requests.");
                return;
            }

            if (req.query.u) { // ?u={username
                console.log("Looking up user ID..");
                userInfoObject = await recnet.getUserInfo(req.query.u);
                accountId = userInfoObject.accountId;

                if (type == 1) {
                    url = `https://api.rec.net/api/images/v3/feed/player/${accountId}?skip=${skipAmount}&take=${takeAmount}`;
                } else if (type == 2) {
                    url = `https://api.rec.net/api/images/v4/player/${accountId}?skip=${skipAmount}&take=${takeAmount}`;
                }

            } else if (req.query.uid) {
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

        } else if (type == 3) { // Global Images (Rec.net home page)
            var dtToday = moment().format();
            url = `https://api.rec.net/api/images/v3/feed/global?skip=${skipAmount}&take=${takeAmount}&since=${dtToday}`;
        }
    }

    var imageData = {};
    if (url == '') {
        imageData = await recnet.getData(url);

        // Filter Image Data TODO
        // Sort Image Data
        // Newest To Oldest = 0 (default)
        // Oldest To Newest = 1 
        // Cheers Ascending = 2
        // Cheers Descending = 3
        // Comment Count Ascending = 4
        // Comment Count Descending = 5
        if (req.query.sort) {
            var sort = parseInt(req.query.sort);

            if (sort != req.query.sort) {
                res.send(END_POINT_ADDRESS + ' sort value must be an integer value [0-5].');
                return;
            }

            switch (sort) {
                case 1: // Newest To Oldest (Default)
                    break;
                case 2: // Oldest To Newest
                    imageData = imageData.reverse();
                    break;
                case 3: // Cheers Ascending
                    imageData = imageData.sort((a, b) => parseInt(a.CheerCount) - parseInt(b.CheerCount));
                    break;
                case 4: // Cheers Descending
                    imageData = imageData.sort((a, b) => parseInt(b.CheerCount) - parseInt(a.CheerCount));
                    break;
                case 5: // Comment Count Ascending
                    imageData = imageData.sort((a, b) => parseInt(a.CommentCount) - parseInt(b.CommentCount));
                    break;
                case 6: // Cheers Descending
                    imageData = imageData.sort((a, b) => parseInt(b.CommentCount) - parseInt(a.CommentCount));
                    break;
                default: //
                    res.send(END_POINT_ADDRESS + 'Invalid sort provided value supplied should be [0-5].');
                    return;
            }
        }
    }

    if (imageData == {}){
        res.json(imageData);
    } else {
        res.send("An error occured fetching image data from Rec.net");
    }
});


// Takes in various criteria and returns a set of image results from a user's profile

// Image Locations: Global, User Feed, User Library

// Filter Criteria: 
// Activity:    A:GoldenTrophy or A!:GoldenTrophy
// User:        U:Rocko or U!:Rocko
// Date:        D:1/13/2021
// Date-Range:  DR:1/1/2021-1/5/2021

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});

// Example Filter String: A:GoldenTrophy|U:Rocko