var express = require("express");
var axios = require("axios");
var cors = require('cors');
var app = express();
let port = process.env.PORT || 3000;

app.use(cors())

app.get("/", (req, res) => {
    res.send("API is online! Contact Rocko#8625 on Discord with questions.");
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

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});