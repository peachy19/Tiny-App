var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

var cookieParser = require('cookie-parser');
app.use(cookieParser());

//middleware to for parsing
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Set the template engine to be ejs
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//Displays the Home page
app.get('/', (req, res) => res.send(" Welcome to Tiny App !"))

//Add a new URL
app.get("/urls/new", (req, res) => {
   let templateVars = { username: req.cookies["name"] };
  res.render("urls_new");
});
//Displays all the urls
app.get("/urls", (req, res) => {
  let templateVars;
  console.log(req);
  if(req.cookies){
    templateVars = { urls: urlDatabase,
    username: req.cookies["name"] };
  }
  else {
    templateVars = {urls: urlDatabase, username: null};
  }
 res.render("urls_index", templateVars);
});
//Shows a Edit page for a certain url
app.get("/urls/:id", (req, res) => {
  // let templateVars = { shortURL: req.params.id,
  //   username: req.cookies["name"], };
  // console.log(req.cookies)
  res.render("urls_show", templateVars);
});

//Redirects to /urls after the deleting the selected url from the database
app.post('/urls/:id/delete', (req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
})
//Redirects to /urls after updating the selected url in the database
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.editURL;
  res.redirect('/urls');
})
//Redirects the url to /u/shorturl after generating and assigning a random string to longURL
app.post("/urls/", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/u/${shortURL}`);
});
//Sets the cookie name to username
app.post('/login', (req, res) => {
  console.log("Cookies name", req.body.username);
  res.cookie("name", req.body.username);
  res.redirect('/');
})

//middle link for redirecting from shorturl to corresponding webpage
app.get("/u/:id", (req, res) => {
  res.redirect(urlDatabase[req.params.id]);
});

//Send the json of the urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Listen to the requests from brower at PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let text = "";
    const set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( let i=0; i < 6; i++ )
        text += set.charAt(Math.floor(Math.random() * set.length));

    return text;
}