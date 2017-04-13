const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const cookieParser = require('cookie-parser');
app.use(cookieParser());

//middleware to for parsing
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Fetch database of users
const users = require('./users.js');


//Set the template engine to be ejs
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//Displays the Home page
app.get('/', (req, res) => res.send(" Welcome to Tiny App !"));

//Register page : GET
app.get('/register', (req, res) => {
  res.render("urls_register");
});
//Handles Registration info : POST
app.post('/register', (req, res) => {
  if(!req.body.email || !req.body.password){
    res.statusCode = 400;
    res.end(`Error 400 : Bad Request
    Please input your email and password!`)
  }
  else{
    const key = findUserByEmail(req.body.email);
    console.log("user is", users[key]);
    if(user){
      res.statusCode = 400;
      res.end(`Error 400 : Bad Request
      Email already exists!`);
      console.log(users);
    }
    else {
      //Storing in user information in the database
      let id = generateRandomString();
      users[id] = {};
      users[id].user_id = id;
      users[id].email = req.body.email;
      users[id].password = req.body.password;
      console.log(users);
      res.cookie("id", id);
      res.redirect('/');
    }
  }
});
//GET - Login : Displays the login page
app.get('/login', (req, res) => {
  res.render('urls_login');
})

//POST - Login : Sets the cookie name to username
app.post('/login', (req, res) => {
  res.cookie("name", req.body.username);
  res.redirect('/');
});
//Logouts
app.post('/logout', (req, res) => {
 res.clearCookie('name');
  res.redirect('/urls');
})

//Add a new URL
app.get("/urls/new", (req, res) => {
  let temp = setCookie(req);
  res.render("urls_new", temp);
});
//Displays all the urls
app.get("/urls", (req, res) => {
 let temp = setCookie(req);
 res.render("urls_index", temp);
});
//Shows an Edit page for a id url
app.get("/urls/:id", (req, res) => {
   let temp = setCookie(req);
  res.render("urls_show", temps);
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


//middle link for redirecting from shorturl to corresponding webpage
app.get("/u/:id", (req, res) => {
  res.redirect(urlDatabase[req.params.id]);
});

//Send the json of the urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Listen to the requests from browser at PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Checks for if email already exists in the database
function findUserByEmail(email){
  for(let key in users){
    if(email === users[key].email){
      console.log(users[key]);
      return users[key];
    }
  }
}

function setCookie(req){
    let templateVars;
  console.log(req);
  if(req.cookies){
    templateVars = { urls: urlDatabase,
    username: req.cookies["name"] };
  }
  else {
    templateVars = {urls: urlDatabase, username: null};
  }
  return templateVars;
}

function generateRandomString() {
  let text = "";
    const set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( let i=0; i < 6; i++ )
        text += set.charAt(Math.floor(Math.random() * set.length));

    return text;
}