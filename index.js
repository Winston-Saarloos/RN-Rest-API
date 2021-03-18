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

app.get("/images/", async (req, res) => {
    // console.log(req.query);
    var userInfoObject;
    var accountId;

    if (req.query.u && req.query.uid) res.send("/images/ : Only username OR user ID can be supplied.");

    if (req.query.u) { // ?u={username}
        // TODO ADD VALIDATION TO MAKE SURE THIS HAS A MAX LENGTH
        console.log("Looking up user ID..");
        userInfoObject = await recnet.getUserInfo('Rocko');
        accountId = userInfoObject.accountId;
    }

    if (req.query.uid) { // ?uid={username}
        // TODO ADD VALIDATION TO MAKE SURE THIS IS NUMERIC
        console.log("User ID supplied..");
        console.log(req.query.uid);
        accountId = req.query.uid;
    }

    var url = 'https://api.rec.net/api/images/v4/player/' + accountId;
    console.log('Fired!');
    axios.get(url)
        .then(response => {
            res.json(response.data);
        });

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