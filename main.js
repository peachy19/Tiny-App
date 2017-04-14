const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const bcrypt = require('bcrypt');

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// const cookieSession = require('cookie-session');

// app.use(cookie-session({
//   name: 'session',
//   keys: ["enlightenment"],

//   // Cookie Options
//   maxAge: 24 * 60 * 60 * 1000 // 24 hours
// }
//   ));

//middleware to for parsing
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Fetch database of users
const users = require('./users.js');


//Set the template engine to be ejs
app.set("view engine", "ejs");

// var urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

var urlDatabase = {};

//GET - Register : Displays the Register page
app.get('/register', (req, res) => {
  res.render("urls_register");
});

//POST - Register : Handles Registration info
app.post('/register', (req, res) => {
  if(!req.body.email || !req.body.password){
    res.statusCode = 400;
    res.end(`Error 400 : Bad Request
    Please input your email and password!`)
  }
  else{
    const user = findUserByEmail(req.body.email);
    //console.log("user is", user);
    if(user){
      res.statusCode = 400;
      res.end(`Error 400 : Bad Request
      Email already exists!`);
      //console.log(users);
    }
    else {
      //Storing in user information in the database
      let id = generateRandomString();
      users[id] = {};
      users[id].id = id;
      users[id].email = req.body.email;
      const hashed_password = bcrypt.hashSync(req.body.password, 10);
      users[id].password = hashed_password;
      console.log("Users are", users);
      res.cookie("id", id);
      res.redirect('/urls');
    }
  }
});

//GET - Login : Displays the login page
app.get('/login', (req, res) => {
  res.render('urls_login');
});

//POST - Login : Handles login info, sets the cookie to id and redirects to homepage if user is authenticated
app.post('/login', (req, res) => {
  const user = findUserByEmail(req.body.email);
  //console.log("USer is", user);

  if(user){
    console.log("User password in db", user.password);
    if (bcrypt.compareSync(req.body.password, user.password)){
      res.cookie("id", user.id);
      res.redirect('/urls')
    }
    else{
      res.statusCode = 403;
      res.end(`Error 403 : Forbidden
      Password does not match` );
    }
  } else {
      res.statusCode = 403;
      res.end(`Error 403 : Forbidden
      User does not exists` );
  }
});

//POST - Logout : Logs the user out and clears the cookie
app.post('/logout', (req, res) => {
 res.clearCookie('id');
  res.redirect('/urls');
});

//GET - Add : Add a new URL
app.get("/urls/new", (req, res) => {
  console.log("ID is", req.cookies.id);
  if(!req.cookies.id){
    res.redirect('/urls');
  }
  else{
     let temp = makeTemplateVars(req);
  res.render("urls_new", temp);
  }

});

//POST - Add : Redirects the url to /u/shorturl after generating and assigning a random string to longURL
app.post("/urls/", (req, res) => {
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].user_id = req.cookies.id;
  urlDatabase[shortURL].url = req.body.longURL;
  console.log(urlDatabase);
  // if(!urlDatabase[req.cookies.id]){
  //   urlDatabase[req.cookies.id] = {};
  // }
  // urlDatabase[req.cookies.id][shortURL] = req.body.longURL;

  // console.log(urlDatabase);
  console.log(`url is /u/${shortURL}`)
  res.redirect(`/u/${shortURL}`);
});

//GET - Display : Displays all the urls
app.get("/urls", (req, res) => {
 let temp = makeTemplateVars(req);
 res.render("urls_index", temp);
});

//POST - Delete : Redirects to /urls after the deleting the selected url from the database
app.post('/urls/:id/delete', (req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
})
//GET - Edit : Shows an Edit page for a id url
app.get("/urls/:id", (req, res) => {
   let temp = { shortURL: req.params.id,
    user: findUserByID(req.cookies.id)};
   //console.log("Tmp is", temp);
  res.render("urls_show", temp);
});
//POST - Edit : Redirects to /urls after updating the selected url in the database
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].url = req.body.editURL;
  res.redirect('/urls');
})

//middle link for redirecting from shorturl to corresponding webpage
app.get("/u/:id", (req, res) => {
  console.log("/u/:id is hit");
  res.redirect(urlDatabase[req.params.id].url);
});

//Send the json of the urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Listen to the requests from browser at PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Return the user for the email matched
function findUserByEmail(email){
   //console.log("email 1", email);
  for(let key in users){

    //console.log("Email", users[key].email);
    if(email === users[key].email){
      //console.log("Users in find email",users[key]);
      return users[key];
    }
  }
}

//Return the user for the id matched
function findUserByID(id){
  //console.log("ID 1", id);
  for(let key in users){
    //console.log("ID", users[key].id);
    if(id === users[key].id){
      //console.log("User in find function",users[key]);
      return users[key];
    }
  }
}

function makeTemplateVars(req){
  let templateVars;
  //console.log(req.cookies);
  let temp = findUserByID(req.cookies.id);
  //console.log("USer found by cookie is ", temp);
  if(req.cookies){
    templateVars = { urls: urlsForUser(req.cookies.id),
    user: temp};
  }
  else {
    templateVars = {urls: null, user: null};
  }
  return templateVars;
}

function urlsForUser(id){
  console.log("ID ", id);
  var temp_urls = {};
  for(let key in urlDatabase){
    if(urlDatabase[key]['user_id'] === id){
      temp_urls[key] = urlDatabase[key];
    }
  }
  console.log("Passed urls are", temp_urls);
  return temp_urls;
}


function generateRandomString() {
  let text = "";
    const set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( let i=0; i < 6; i++ )
        text += set.charAt(Math.floor(Math.random() * set.length));

    return text;
}