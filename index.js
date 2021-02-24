var express = require("express");
var axios = require("axios");
var app = express();

app.get("/", (req, res, next) => {
    var url = 'https://accounts.rec.net/account?username=' + req.query.user;
    var result = '';
    axios.get(url)
        .then(response => {
            res.json(response.data);
            console.log(response.data);
        });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});