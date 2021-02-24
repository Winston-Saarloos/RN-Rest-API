var express = require("express");
var axios = require("axios");
var app = express();
let port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("API is functioning");
});

app.get("/users", (req, res, next) => {
    var url = 'https://accounts.rec.net/account?username=' + req.query.user;
    var result = '';
    axios.get(url)
        .then(response => {
            res.json(response.data);
            console.log(response.data);
        });
});

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});