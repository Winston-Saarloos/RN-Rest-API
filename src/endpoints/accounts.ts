var recnet = require("../recNet");
var common = require("../classes/common");

async function getUserInfoFromUsername(
  req: { query: { u: any } },
  res: { json: (arg0: any) => void }
) {
  if (req.query.u) {
    // ?u={@name}
    var data = await recnet.getData(
      `https://accounts.rec.net/account?username=${req.query.u}`
    );

    if (data.status === 404) {
      data.message = "Username not found.";
    }

    res.json(data);
  }
}

async function getUserInfoFromId(
  req: { query: { id: any } },
  res: { json: (arg0: any) => void }
) {
  if (req.query.id) {
    // ?id={playerId}
    var data = await recnet.getData(
      `https://accounts.rec.net/account/${req.query.id}`
    );

    if (data.status === 400) {
      data.message = data.dataObject.errors.accountId;
    } else if (data.status === 404) {
      data.message = "User ID not found.";
    }

    res.json(data);
  }
}

async function getUserBioFromId(
  req: { query: { bio: any } },
  res: { json: (arg0: any) => void }
) {
  if (req.query.bio) {
    // ?bio={playerId}
    res.json(
      await recnet.getData(
        `https://accounts.rec.net/account/${req.query.bio}/bio`
      )
    );
  }
}

async function getBulkAccountsById(
  req: { query: { id: string | any[] } },
  res: { json: (arg0: any) => void }
) {
  if (req.query.id) {
    var szUrl = "https://accounts.rec.net/account/bulk";
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

    res.json(await recnet.getData(szUrl + szParams));
  } else {
    common.responseJson(res, [], 405, "/bulk/users :  Missing 'ID' parameter.");
  }
}

module.exports.getUserInfoFromUsername = getUserInfoFromUsername;
module.exports.getUserInfoFromId = getUserInfoFromId;
module.exports.getUserBioFromId = getUserBioFromId;
module.exports.getBulkAccountsById = getBulkAccountsById;
