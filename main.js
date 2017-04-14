const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: ["enlightenment"],

  // Cookie Options // 24 hours
  maxAge: 24 * 60 * 60 * 1000
}
  ));

//middleware to for parsing
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Fetch database of users
const users = require('./users.js');


//Set the template engine to be ejs
app.set("view engine", "ejs");

// app.use((req, res) => {
//   if(!req.session.id){
//     res.statusCode = 401;
//     res.render('error', errorPageSetup(401,'You are not logged-in. Please log-in'));
//   }
//
// });
const urlDatabase = {};

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

// find urls for the given user
function urlsForUser(id){
  //console.log("ID ", id);
  let temp = {};
  for(let key in urlDatabase){
    if(urlDatabase[key]['userID'] === id){
      temp[key] = urlDatabase[key];
    }
  }
  //console.log("Passed urls are", temp);
  return temp;
}

//Setup template vars for the headers and html pages
function makeTemplateVars(req){
  let templateVars;
  //console.log(req.session);
  let temp = findUserByID(req.session.id);
  //console.log("USer found by cookie is ", temp);
  if(req.session){
    templateVars = { urls: urlsForUser(req.session.id), user: temp};
  } else {
    templateVars = {urls: null, user: null};
  }
  return templateVars;
}

//Setup the templateVars to be send to error page
function errorPageSetup(code, msg){
  let tempVars = {code: code, message: msg };
  return tempVars;
}

//Generate random string
function generateRandomString() {
  let text = "";
  const set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(let i = 0; i < 6; i++ ){
    text += set.charAt(Math.floor(Math.random() * set.length));
  }
  return text;
}

app.get('/', (req, res) => {
  if(!req.session.id){
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

//GET - Register : Displays the Register page
app.get('/register', (req, res) => {
  if(!req.session.id){
    res.render('urls_register');
  } else {
    res.redirect('/urls');
  }

});

//POST - Register : Handles Registration info
app.post('/register', (req, res) => {
  if(!req.body.email || !req.body.password){
    res.statusCode = 400;
    res.end(`Error 400 : Bad Request
    Please input your email and password!`);
  } else{
    const user = findUserByEmail(req.body.email);
    //console.log("user is", user);
    if(user){
      res.statusCode = 400;
      res.end(`Error 400 : Bad Request
      Email already exists!`);
    } else {
      //Storing in user information in the database
      let id = generateRandomString();
      users[id] = {};
      users[id].id = id;
      users[id].email = req.body.email;
      const hashedPassword = bcrypt.hashSync(req.body.password, 10);
      users[id].password = hashedPassword;
      console.log("Users are", users);
      req.session.id = id;
      res.redirect('/urls');
    }
  }
});

//GET - Login : Displays the login page
app.get('/login', (req, res) => {
  if(!req.session.id){
    res.render('urls_login');
  } else {
    res.redirect('/urls');
  }

});

//POST - Login : Handles login info, sets the cookie to id and redirects to homepage if user is authenticated
app.post('/login', (req, res) => {
  const user = findUserByEmail(req.body.email);
  //console.log("USer is", user);
  if(user){
    //console.log("User password in db", user.password);
    if (bcrypt.compareSync(req.body.password, user.password)){
      req.session.id = user.id;
      res.redirect('/urls');
    } else{
      res.statusCode = 403;
      res.render('error', errorPageSetup(403, 'Your password does not match. Please log-in again!'));
    }
  } else {
    res.statusCode = 403;
    res.render('error', errorPageSetup(403, 'User does not exists. Please register!'));
  }
});

//POST - Logout : Logs the user out and clears the cookie
app.post('/logout', (req, res) => {
  // res.clearCookie('id');
  req.session = null;
  res.redirect('/');
});

//GET - Add : Add a new URL
app.get("/urls/new", (req, res) => {
  console.log("ID is", req.session.id);
  if(!req.session.id){
    res.statusCode = 401;
    res.render('error', errorPageSetup(401, 'You are not logged-in. Please log-in'));
  } else{
    let temp = makeTemplateVars(req);
    res.render("urls_new", temp);
  }

});

//GET - Display : Displays all the urls
app.get("/urls", (req, res) => {
  if(!req.session.id){
    res.statusCode = 401;
    res.render('error', errorPageSetup(401, 'You are not logged-in. Please log-in'));
  } else {
    let temp = makeTemplateVars(req);
    res.render("urls_index", temp);
  }

});

//POST - Add : Redirects the url to /u/shorturl after generating and assigning a random string to longURL
app.post("/urls/", (req, res) => {
  const shortURL = generateRandomString();
  if(!req.session.id){
    res.statusCode = 401;
    res.statusCode = 401;
    res.render('error', errorPageSetup(401, 'You are not logged-in. Please log-in'));
  } else{
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].userID = req.session.id;
    urlDatabase[shortURL].url = req.body.longURL;
    console.log(urlDatabase);
    //console.log(`url is /u/${shortURL}`)
    //res.redirect(`/u/${shortURL}`);
    res.redirect(`urls/${shortURL}`);
  }

});


//GET - Edit : Shows an Edit page for a id url
app.get("/urls/:id", (req, res) => {
  if(!req.session.id){
    res.statusCode = 401;
    res.render('error', errorPageSetup(401, 'You are not logged-in. Please log-in'));
  } else {
    if(!urlDatabase[req.params.id]){
      res.statusCode = 404;
      res.send("Error 404 : Page not found");
    }
    if(urlDatabase[req.params.id].userID === findUserByID(req.session.id).id){
      //console.log("Tmp is", temp);
      let temp = { shortURL: req.params.id, url: urlDatabase[req.params.id].url, user: findUserByID(req.session.id)};
      res.render("urls_show", temp);
    } else {
      res.statusCode = 403;
      res.end("You are trying to access the url that doesn't belong to you.");
    }
  }
});
//POST - Edit : Redirects to /urls:id after updating the selected url in the database
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].url = req.body.editURL;
  //console.log(`/urls/${req.params.id}`)
  res.redirect(`/urls/${req.params.id}`);
});

//POST - Delete : Redirects to /urls after the deleting the selected url from the database
app.post('/urls/:id/delete', (req, res) => {
  console.log("Data deleted is", urlDatabase[req.params.id]);
  delete urlDatabase[req.params.id];
  console.log("Delete is hit");
  res.redirect('/urls');
});

//middle link for redirecting from shorturl to corresponding webpage
app.get("/u/:id", (req, res) => {
  if(!urlDatabase[req.params.id]){
    res.statusCode = 404;
    res.send("Error 404 : Page not found");
  } else {
    //console.log("/u/:id is hit");
    res.redirect(urlDatabase[req.params.id].url);
  }

});

//Send the json of the urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Listen to the requests from browser at PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

