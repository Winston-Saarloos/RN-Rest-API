var express = require("express");
var cors = require('cors');
//var bodyParser = require('body-parser');
var moment = require('moment');
const { DateTime, Interval } = require("luxon");
//Const { Interval } = 'luxon/src/interval.js'
var app = express();
let port = process.env.PORT || 3000;

// Classes

// RecNet Modules
var recnet = require('./recNet');
var imageHelper = require('./classes/imageHelper');
var versionNumber = '0.7.7'

app.use(cors());

app.get("/", (req, res) => {
    //res.send("RN-ExtraTools.com API is online! V" + versionNumber);
    responseJson(res, [], 200, "RN-ExtraTools.com API is online! V" + versionNumber);
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
        responseJson(res, [], 405, END_POINT_ADDRESS & "Supplied parameter is not permitted.");
        return;
    }
});

// Get request for https://accounts.rec.net/account/bulk
app.get("/bulk/users", async (req, res) => {
    if (req.query.id) {
        var szUrl = 'https://accounts.rec.net/account/bulk';
        var szParams = '';

        if (typeof req.query.id == 'string') {
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

        var userData = await recnet.getData(szUrl + szParams);
        res.json(userData);

    } else {
        responseJson(res, [], 405, "/bulk/users :  Missing 'ID' parameter.");
    }
});

// Get request for https://rooms.rec.net/rooms/bulk
app.get("/bulk/rooms", async (req, res) => {
    if (req.query.id) {
        var szUrl = 'https://rooms.rec.net/rooms/bulk';
        var szParams = '';

        if (typeof req.query.id == 'string') {
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
        responseJson(res, [], 405, "/bulk/rooms :  Missing 'ID' or 'Name' parameter.");
    }
});

// https://api.rec.net/api/playerevents/v1/bulk
app.get("/bulk/events", async (req, res) => {
    if (req.query.id) {
        var szUrl = 'https://api.rec.net/api/playerevents/v1/bulk';

        var eventData = await recnet.getBulkEventInfo(req.query.id, szUrl);

        res.json(eventData);
    } else {
        responseJson(res, [], 405, "/bulk/events :  Missing 'ID' parameter.");
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

        if (type === 1 || type === 2) { // Photo Feed or User Photo Library Types

            // You cannot provide both 'u' and 'uid' parameter arguments
            if (req.query.u && req.query.uid) {
                responseJson(res, [], 405, END_POINT_ADDRESS & "Only username OR user ID can be supplied.");
                return;
            }

            if (!req.query.u && !req.query.uid) {
                responseJson(res, [], 405, "A username or user ID must be provided with type 1 and type 2 requests.");
                return;
            }

            if (req.query.u) { // ?u={username
                var userInfo = await recnet.getUserInfo(req.query.u);
                userInfoObject = userInfo.dataObject;

                if (userInfo.status != 200) {
                    var status = userInfo.status;
                    console.log(`Error Status: ${status}`);

                    if (status == 404) {
                        responseJson(res, [], status, 'Username does not exist on server.  Please try a different value.');
                    } else {
                        responseJson(res, [], status, `An error occured fetching user information. Status Code: ${status}`);
                    }
                } else {
                    accountId = userInfoObject.accountId;
                }

                if (type === 1) {
                    url = `https://api.rec.net/api/images/v3/feed/player/${accountId}?skip=${skipAmount}&take=${takeAmount}`;
                } else if (type === 2) {
                    url = `https://api.rec.net/api/images/v4/player/${accountId}?skip=${skipAmount}&take=${takeAmount}`;
                }

            } else if (req.query.uid) {
                accountId = parseInt(req.query.uid);

                if (accountId != req.query.uid) {
                    responseJson(res, [], 405, END_POINT_ADDRESS + 'UID value must be an integer value.');
                    return;
                }

                if (accountId <= 0) {
                    responseJson(res, [], 405, END_POINT_ADDRESS + 'UID value must be greater than 0.');
                    return;
                }
            }

        } else if (type === 3) { // Global Images (Rec.net home page)
            var dtToday = moment().format();
            url = `https://api.rec.net/api/images/v3/feed/global?skip=${skipAmount}&take=${takeAmount}&since=${dtToday}`;
        } else if (type === 4) {
            if (req.query.room) {
                var roomInfo = await recnet.getRoomInfo(req.query.room);
                roomInfoObject = roomInfo.dataObject;

                url = `https://api.rec.net/api/images/v4/room/${roomInfoObject.RoomId}?skip=${skipAmount}&take=${takeAmount}`;    
            }
        }
    }

    var imageData = {};
    if (url != '') {
        var imageObject = await recnet.getData(url);
        var imageData = imageObject.dataObject;

        // Filter Image Data
        if (req.query.filter) {
            // TODO validation on the filter string

            // Function GET/PARSE filter values into array of filter values

            var filterValues = imageHelper.parseFilterValues(req.query.filter);
            console.log(`Filter Values: ${filterValues}`);

            var filteredImageCollection = [];

            // for each image
            if (filterValues.length != 0) {
                imageData.forEach(image => {

                    // for each filter item (verify image has the correct criteria)
                    var imageMustMatchAllFilters = true; // TODO MAKE THIS TOGGLEABLE ON THE UI
                    var imageMatchesAllFilterCriteria = true;

                    var imageMatchedAtleastOneCriteria = false;
                    filterValues.forEach(filter => {
                        var filterParts = filter.split("|");

                        switch (filterParts[0]) {
                            case 'A':
                                // Activity
                                // Example Value: A|GoldenTrophy
                                if (image.RoomId == filterParts[1]) {
                                    imageMatchedAtleastOneCriteria = true;
                                } else if (imageMustMatchAllFilters) {
                                    imageMatchesAllFilterCriteria = false;
                                }
                                break;

                            case '!A':
                                // Not Activity
                                // Example Value: !A|GoldenTrophy
                                if (image.RoomId != filterParts[1]) {
                                    imageMatchedAtleastOneCriteria = true;
                                } else if (imageMustMatchAllFilters) {
                                    imageMatchesAllFilterCriteria = false;
                                }
                                break;

                            case 'U':
                                // User
                                // Example Value: U|Boethiah
                                //console.log(image.TaggedPlayerIds.length);
                                if (image.TaggedPlayerIds.length === 0) {
                                    imageMatchesAllFilterCriteria = false;
                                    break;
                                }

                                var taggedPlayers = [];
                                image.TaggedPlayerIds.forEach(player => { taggedPlayers.push(player) });
                                if ((taggedPlayers.findIndex((player) => player == filterParts[1]) > -1) && imageMatchesAllFilterCriteria) {
                                    imageMatchedAtleastOneCriteria = true;
                                } else if (imageMustMatchAllFilters) {
                                    imageMatchesAllFilterCriteria = false;
                                }
                                break;

                            case '!U':
                                // Not (A Given User)
                                // Example Value: !U|Boethiah
                                if (image.TaggedPlayerIds.length === 0) {
                                    imageMatchesAllFilterCriteria = false;
                                    break;
                                }

                                var taggedPlayers = [];
                                image.TaggedPlayerIds.forEach(player => { taggedPlayers.push(player) });
                                if (!(taggedPlayers.findIndex((player) => player == filterParts[1]) > -1) && imageMatchesAllFilterCriteria) {
                                    imageMatchedAtleastOneCriteria = true;
                                } else if (imageMustMatchAllFilters) {
                                    imageMatchesAllFilterCriteria = false;
                                }
                                break;
                            
                            case 'E':
                                // Event
                                // Example Value: Not Implemented Yet

                                break;

                            case '!E':
                                // Not Event
                                // Example Value: Not Implemented Yet

                                break;

                            case 'D':
                                // Date
                                var imageDate = DateTime.fromISO(image.CreatedAt);
                                var filterDate = DateTime.fromISO(filterParts[1]);

                                if (imageDate.year == filterDate.year && imageDate.month == filterDate.month && imageDate.day == filterDate.day) {
                                    imageMatchedAtleastOneCriteria = true;

                                } else if (imageMustMatchAllFilters) {
                                    imageMatchesAllFilterCriteria = false;
                                }

                                break;

                            case '!D':
                                // Not (Given Date)
                                var imageDate = DateTime.fromISO(image.CreatedAt);
                                var filterDate = DateTime.fromISO(filterParts[1]);

                                if (imageDate.year !== filterDate.year && imageDate.month !== filterDate.month && imageDate.day !== filterDate.day) {
                                    imageMatchedAtleastOneCriteria = true;
                                    
                                } else if (imageMustMatchAllFilters) {
                                    imageMatchesAllFilterCriteria = false;
                                }

                                break;

                            case 'DR':
                                // Date Range
                                var imageDate = DateTime.fromISO(image.CreatedAt);
                                var dateParts = filterParts[1].split("!");
                                var filterDate1 = DateTime.fromISO(dateParts[0]);
                                var filterDate2 = DateTime.fromISO(dateParts[1]);

                                if (filterDate1 < filterDate2) { // If D1 is before D2
                                    var rangeOfTime = Interval.fromDateTimes(filterDate1, filterDate2)
                                    if (rangeOfTime.contains(imageDate)) {
                                        imageMatchedAtleastOneCriteria = true;
                                    } else if (imageMustMatchAllFilters) {
                                        imageMatchesAllFilterCriteria = false;
                                    }

                                } else {
                                    var rangeOfTime = Interval.fromDateTimes(filterDate2, filterDate1)
                                    if (rangeOfTime.contains(imageDate)) {
                                        imageMatchedAtleastOneCriteria = true;

                                    } else if (imageMustMatchAllFilters) {
                                        imageMatchesAllFilterCriteria = false;
                                    }
                                }

                                break;

                            case '!DR':
                                // Not (Given Date Range)
                                var imageDate = DateTime.fromISO(image.CreatedAt);
                                var dateParts = filterParts[1].split("!");
                                var filterDate1 = DateTime.fromISO(dateParts[0]);
                                var filterDate2 = DateTime.fromISO(dateParts[1]);

                                if (filterDate1 < filterDate2) { // If D1 is before D2
                                    var rangeOfTime = Interval.fromDateTimes(filterDate1, filterDate2)
                                    if (!(rangeOfTime.contains(imageDate))) {
                                        imageMatchedAtleastOneCriteria = true;
                                    } else if (imageMustMatchAllFilters) {
                                        imageMatchesAllFilterCriteria = false;
                                    }

                                } else {
                                    var rangeOfTime = Interval.fromDateTimes(filterDate2, filterDate1)
                                    if (!(rangeOfTime.contains(imageDate))) {
                                        imageMatchedAtleastOneCriteria = true;

                                    } else if (imageMustMatchAllFilters) {
                                        imageMatchesAllFilterCriteria = false;
                                    }
                                }

                                break;

                            case 'CC':
                                // Comment Count
                                // Example Value: Not Implemented Yet

                                break;

                            case '!CC':
                                // Not Comment Count
                                // Example Value: Not Implemented Yet

                                break;

                            case 'LC':
                                // Like Count
                                // Example Value: Not Implemented Yet

                                break;

                            case '!LC':
                                // Not Like Count
                                // Example Value: Not Implemented Yet

                                break;

                            default:
                                //error occured log to console
                                console.log("An error occured parsing filter type: " + filterType);
                        }
                    });

                    if (imageMustMatchAllFilters && imageMatchesAllFilterCriteria) {
                        filteredImageCollection.push(image);
                    } else if (!(imageMustMatchAllFilters) && imageMatchedAtleastOneCriteria) {
                        filteredImageCollection.push(image);
                    }
                });
            };

            // Assign the results back to the original imageData collection
            imageData = filteredImageCollection;
        }

        //https://rn-rest-api.herokuapp.com/images?u=Winston.Saarloos&sort=1&type=1&skip=0&take=100000&filter=U%7C181665

        // Decoded Filter String: U|181665
        // Encoded Filter String: U%7C181665
        // | = %7C

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
                responseJson(res, [], 405, END_POINT_ADDRESS + 'Sort value must be an integer value [1-6].');
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
                    responseJson(res, [], 405, END_POINT_ADDRESS + 'Sort value must be an integer value [1-6].');
                    return;
            }
        }
    }

    if (imageData.length === 0) {
        responseJson(res, [], 200, "The supplied user does not have any public photos.");
    } else if (imageData.length > 0){
        responseJson(res, imageData, 200, '');
    } else {
        responseJson(res, [], 500, "An error occured fetching image data from Rec.net");
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


async function responseJson(response, data, status, message) {
    response.json({dataObject: data, status: status, message: message});
}
// Example Filter String: A:GoldenTrophy|U:Rocko