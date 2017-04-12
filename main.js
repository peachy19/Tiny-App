var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

//Send the json of the urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Send the html to the /hello path
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//Listen to the requests from brower at port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
