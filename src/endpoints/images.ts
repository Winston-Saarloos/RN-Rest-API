import image from '../models/image';
var moment = require("moment");
const { DateTime, Interval } = require("luxon");
var recnet = require("../recNet");
var common = require("../classes/common");
var imageHelper = require("../classes/imageHelper");

async function ImagesV1(
  req: {
    query: {
      take: number;
      skip: number;
      type: string;
      u: any;
      uid: string | number;
      room: any;
      filter: any;
      sort: string | number;
    };
  },
  res: any
) {
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
  const END_POINT_ADDRESS = "/images/ : ";
  const MAX_RETURN_NUMBER = 100000;
  var userInfoObject: { accountId: number };
  var accountId = 0;
  var takeAmount = MAX_RETURN_NUMBER; // Default Values
  var skipAmount = 0;
  var url = "";

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

    if (type === 1 || type === 2) {
      // Photo Feed or User Photo Library Types

      // You cannot provide both 'u' and 'uid' parameter arguments
      if (req.query.u && req.query.uid) {
        common.responseJson(
          res,
          [],
          405,
          `${END_POINT_ADDRESS} Only username OR user ID can be supplied.`
        );
        return;
      }

      if (!req.query.u && !req.query.uid) {
        common.responseJson(
          res,
          [],
          405,
          "A username or user ID must be provided with type 1 and type 2 requests."
        );
        return;
      }

      if (req.query.u) {
        // ?u={username
        var userInfo = await recnet.getUserInfo(req.query.u);
        userInfoObject = userInfo.dataObject;

        if (userInfo.status != 200) {
          var status = userInfo.status;
          console.log(`Error Status: ${status}`);

          if (status == 404) {
            common.responseJson(
              res,
              [],
              status,
              "Username does not exist on server.  Please try a different value."
            );
          } else {
            common.responseJson(
              res,
              [],
              status,
              `An error occured fetching user information. Status Code: ${status}`
            );
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
        accountId = parseInt(String(req.query.uid));

        if (accountId != req.query.uid) {
          common.responseJson(
            res,
            [],
            405,
            `${END_POINT_ADDRESS} UID value must be an integer value.`
          );
          return;
        }

        if (accountId <= 0) {
          common.responseJson(
            res,
            [],
            405,
            `${END_POINT_ADDRESS} UID value must be greater than 0.`
          );
          return;
        }
      }
    } else if (type === 3) {
      // Global Images (Rec.net home page)
      var dtToday = moment().format();
      url = `https://api.rec.net/api/images/v3/feed/global?skip=${skipAmount}&take=${takeAmount}&since=${dtToday}`;
    } else if (type === 4) {
      if (req.query.room) {
        var roomInfo = await recnet.getRoomInfo(req.query.room);
        const roomInfoObject = roomInfo.dataObject[0];

        url = `https://api.rec.net/api/images/v4/room/${roomInfoObject.RoomId}?skip=${skipAmount}&take=${takeAmount}`;
      }
    }
  }

  var imageData = [];
  if (url !== "") {
    var imageObject = await recnet.getData(url);
    imageData = imageObject.dataObject;

    // Filter Image Data
    if (req.query.filter) {
      // TODO validation on the filter string

      // Function GET/PARSE filter values into array of filter values

      var filterValues = imageHelper.parseFilterValues(req.query.filter);

      var filteredImageCollection: image[] = [];

      // for each image
      if (filterValues.length != 0) {
        imageData.forEach(
          (image: image) => {
            // for each filter item (verify image has the correct criteria)
            var imageMustMatchAllFilters = true; // TODO MAKE THIS TOGGLEABLE ON THE UI
            var imageMatchesAllFilterCriteria = true;

            var imageMatchedAtleastOneCriteria = false;
            filterValues.forEach((filter: string) => {
              var filterParts = filter.split("|");

              switch (filterParts[0]) {
                case "A":
                  // Activity
                  // Example Value: A|GoldenTrophy
                  if (image.RoomId == parseInt(filterParts[1])) {
                    imageMatchedAtleastOneCriteria = true;
                  } else if (imageMustMatchAllFilters) {
                    imageMatchesAllFilterCriteria = false;
                  }
                  break;

                case "!A":
                  // Not Activity
                  // Example Value: !A|GoldenTrophy
                  if (image.RoomId != parseInt(filterParts[1])) {
                    imageMatchedAtleastOneCriteria = true;
                  } else if (imageMustMatchAllFilters) {
                    imageMatchesAllFilterCriteria = false;
                  }
                  break;

                case "U":
                  // User
                  // Example Value: U|Boethiah
                  //console.log(image.TaggedPlayerIds.length);
                  if (image.TaggedPlayerIds.length === 0) {
                    imageMatchesAllFilterCriteria = false;
                    break;
                  }

                  var taggedPlayers: number[] = [];
                  image.TaggedPlayerIds.forEach((player: any) => {
                    taggedPlayers.push(player);
                  });
                  if (
                    taggedPlayers.findIndex(
                      (player) => player == parseInt(filterParts[1])
                    ) > -1 &&
                    imageMatchesAllFilterCriteria
                  ) {
                    imageMatchedAtleastOneCriteria = true;
                  } else if (imageMustMatchAllFilters) {
                    imageMatchesAllFilterCriteria = false;
                  }
                  break;

                case "!U":
                  // Not (A Given User)
                  // Example Value: !U|Boethiah
                  if (image.TaggedPlayerIds.length === 0) {
                    imageMatchesAllFilterCriteria = false;
                    break;
                  }

                  var taggedPlayers: number[] = [];
                  image.TaggedPlayerIds.forEach((player: number) => {
                    taggedPlayers.push(player);
                  });
                  if (
                    !(
                      taggedPlayers.findIndex(
                        (player) => player == parseInt(filterParts[1])
                      ) > -1
                    ) &&
                    imageMatchesAllFilterCriteria
                  ) {
                    imageMatchedAtleastOneCriteria = true;
                  } else if (imageMustMatchAllFilters) {
                    imageMatchesAllFilterCriteria = false;
                  }
                  break;

                case "E":
                  // Event
                  // Example Value: Not Implemented Yet

                  break;

                case "!E":
                  // Not Event
                  // Example Value: Not Implemented Yet

                  break;

                case "D":
                  // Date
                  var imageDate = DateTime.fromISO(image.CreatedAt).toLocal();
                  var filterDate = DateTime.fromISO(filterParts[1]).toLocal();

                  if (
                    imageDate.year == filterDate.year &&
                    imageDate.month == filterDate.month &&
                    imageDate.day == filterDate.day
                  ) {
                    imageMatchedAtleastOneCriteria = true;
                  } else if (imageMustMatchAllFilters) {
                    imageMatchesAllFilterCriteria = false;
                  }

                  break;

                case "!D":
                  // Not (Given Date)
                  var imageDate = DateTime.fromISO(image.CreatedAt).toLocal();
                  var filterDate = DateTime.fromISO(filterParts[1]).toLocal();

                  if (
                    imageDate.year !== filterDate.year &&
                    imageDate.month !== filterDate.month &&
                    imageDate.day !== filterDate.day
                  ) {
                    imageMatchedAtleastOneCriteria = true;
                  } else if (imageMustMatchAllFilters) {
                    imageMatchesAllFilterCriteria = false;
                  }

                  break;

                case "DR":
                  // Date Range
                  var imageDate = DateTime.fromISO(image.CreatedAt).toLocal();
                  var dateParts = filterParts[1].split("!");
                  var filterDate1 = DateTime.fromISO(dateParts[0]).toLocal();
                  var filterDate2 = DateTime.fromISO(dateParts[1]).toLocal();

                  if (filterDate1 < filterDate2) {
                    // If D1 is before D2
                    var rangeOfTime = Interval.fromDateTimes(
                      filterDate1,
                      filterDate2
                    );
                    if (rangeOfTime.contains(imageDate)) {
                      imageMatchedAtleastOneCriteria = true;
                    } else if (imageMustMatchAllFilters) {
                      imageMatchesAllFilterCriteria = false;
                    }
                  } else {
                    var rangeOfTime = Interval.fromDateTimes(
                      filterDate2,
                      filterDate1
                    );
                    if (rangeOfTime.contains(imageDate)) {
                      imageMatchedAtleastOneCriteria = true;
                    } else if (imageMustMatchAllFilters) {
                      imageMatchesAllFilterCriteria = false;
                    }
                  }

                  break;

                case "!DR":
                  // Not (Given Date Range)
                  var imageDate = DateTime.fromISO(image.CreatedAt).toLocal();
                  var dateParts = filterParts[1].split("!");
                  var filterDate1 = DateTime.fromISO(dateParts[0]).toLocal();
                  var filterDate2 = DateTime.fromISO(dateParts[1]).toLocal();

                  if (filterDate1 < filterDate2) {
                    // If D1 is before D2
                    var rangeOfTime = Interval.fromDateTimes(
                      filterDate1,
                      filterDate2
                    );
                    if (!rangeOfTime.contains(imageDate)) {
                      imageMatchedAtleastOneCriteria = true;
                    } else if (imageMustMatchAllFilters) {
                      imageMatchesAllFilterCriteria = false;
                    }
                  } else {
                    var rangeOfTime = Interval.fromDateTimes(
                      filterDate2,
                      filterDate1
                    );
                    if (!rangeOfTime.contains(imageDate)) {
                      imageMatchedAtleastOneCriteria = true;
                    } else if (imageMustMatchAllFilters) {
                      imageMatchesAllFilterCriteria = false;
                    }
                  }

                  break;

                case "CC":
                  // Comment Count
                  // Example Value: Not Implemented Yet

                  break;

                case "!CC":
                  // Not Comment Count
                  // Example Value: Not Implemented Yet

                  break;

                case "LC":
                  // Like Count
                  // Example Value: Not Implemented Yet

                  break;

                case "!LC":
                  // Not Like Count
                  // Example Value: Not Implemented Yet

                  break;

                default:
                  //error occured log to console
                  console.log(
                    "An error occured parsing filter type: " + filterParts[0]
                  );
              }
            });

            if (imageMustMatchAllFilters && imageMatchesAllFilterCriteria) {
              filteredImageCollection.push(image);
            } else if (
              !imageMustMatchAllFilters &&
              imageMatchedAtleastOneCriteria
            ) {
              filteredImageCollection.push(image);
            }
          }
        );
      }

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
      var sort = parseInt(String(req.query.sort));

      if (sort != req.query.sort) {
        common.responseJson(
          res,
          [],
          405,
          END_POINT_ADDRESS + "Sort value must be an integer value [1-6]."
        );
        return;
      }

      switch (sort) {
        case 1: // Newest To Oldest (Default)
          break;
        case 2: // Oldest To Newest
          imageData = imageData.reverse();
          break;
        case 3: // Cheers Ascending
          imageData = imageData.sort(
            (a: { CheerCount: string }, b: { CheerCount: string }) =>
              parseInt(a.CheerCount) - parseInt(b.CheerCount)
          );
          break;
        case 4: // Cheers Descending
          imageData = imageData.sort(
            (a: { CheerCount: string }, b: { CheerCount: string }) =>
              parseInt(b.CheerCount) - parseInt(a.CheerCount)
          );
          break;
        case 5: // Comment Count Ascending
          imageData = imageData.sort(
            (a: { CommentCount: string }, b: { CommentCount: string }) =>
              parseInt(a.CommentCount) - parseInt(b.CommentCount)
          );
          break;
        case 6: // Cheers Descending
          imageData = imageData.sort(
            (a: { CommentCount: string }, b: { CommentCount: string }) =>
              parseInt(b.CommentCount) - parseInt(a.CommentCount)
          );
          break;
        default: //
          common.responseJson(
            res,
            [],
            405,
            END_POINT_ADDRESS + "Sort value must be an integer value [1-6]."
          );
          return;
      }
    }
  }

  if (imageData.length === 0) {
    common.responseJson(
      res,
      [],
      200,
      "The supplied user does not have any public photos."
    );
  } else if (imageData.length > 0) {
    common.responseJson(res, imageData, 200, "");
  } else {
    common.responseJson(
      res,
      [],
      500,
      "An error occured fetching image data from Rec.net"
    );
  }
}

async function getGlobalImages(
  req: { query: { take: string; date: string | number | Date } },
  res: { json: (arg0: any) => void }
) {
  //Possible Parameters
  //- Date
  //- Take
  const END_POINT_ADDRESS = "/images/global : ";
  if (req.query.take || req.query.date) {
    var dtToday = moment().format();
    var iReturnAmount = 2000;
    if (req.query.take) {
      var iTake = parseInt(req.query.take);
      if (iTake > 0) {
        iReturnAmount = iTake;
      }
    }

    var date = 0;
    if (req.query.date) {
      date = moment(new Date(req.query.date)).format();
    }

    if (date < dtToday) {
      // This date isnt working correctly.. but the take is working fine
      dtToday = date;
    }

    var szUrl =
      "https://api.rec.net/api/images/v3/feed/global?skip=0&take=" +
      iReturnAmount +
      "&since=" +
      dtToday;
    var oGlobalData = await recnet.getData(szUrl);

    res.json(oGlobalData);
  } else {
    common.responseJson(
      res,
      [],
      405,
      `${END_POINT_ADDRESS} Supplied parameter is not permitted.`
    );
    return;
  }
}

module.exports.ImagesV1 = ImagesV1;
module.exports.getGlobalImages = getGlobalImages;
