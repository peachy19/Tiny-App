var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

//Set the template engine to be ejs
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Render HTML on path /urls
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

//Send the json of the urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Listen to the requests from brower at PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
