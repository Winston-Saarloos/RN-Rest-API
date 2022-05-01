var recnet = require("../recNet");

async function getUserInfoFromUsername(req, res) {
  if (req.query.u) {
    // ?u={@name}
    var url = "https://accounts.rec.net/account?username=" + req.query.u;
    var data = await recnet.getData(url);

    if (data.status === 404) {
      data.message = "Username not found.";
    }

    res.json(data);
  }
}

async function getUserInfoFromId(req, res) {
  if (req.query.id) {
    // ?id={playerId}
    var url = "https://accounts.rec.net/account/" + req.query.id;
    var data = await recnet.getData(url);

    if (data.status === 400) {
      data.message = data.dataObject.errors.accountId;
    } else if (data.status === 404) {
      data.message = "User ID not found.";
    }

    res.json(data);
  }
}

async function getUserBioFromId(req, res) {
  if (req.query.bio) {
    // ?bio={playerId}
    var url = "https://accounts.rec.net/account/" + req.query.bio + "/bio";
    var data = await recnet.getData(url);

    res.json(data);
  }
}

module.exports.getUserInfoFromUsername = getUserInfoFromUsername;
module.exports.getUserInfoFromId = getUserInfoFromId;
module.exports.getUserBioFromId = getUserBioFromId;
