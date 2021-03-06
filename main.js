const express = require("express");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");

const app = express();
//Set the template engine to be ejs
app.set("view engine", "ejs");

const PORT = process.env.PORT || 3000;
const users = {};
const urlDatabase = {};

//middleware to for parsing
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["enlightenment"],
  maxAge: 24 * 60 * 60 * 1000
}));

//middleware for defining locals
app.use(function(req,res,next){
  res.locals.user = users[req.session.id];
  res.locals.urls = urlsForUser(req.session.id);
  next();
});

app.use('/urls',function(req,res,next){
  if (req.session.id) {
    next();
  } else {
    res.statusCode = 401;
    res.render('error',errorPageSetup(401, "'You are not logged-in. bbbb Please log-in.'"))
  }
})


//Return the user for the email matched
function findUserByEmail(email){
  for(let key in users){
    if(email === users[key].email){
      return users[key];
    }
  }
}

// find urls for the given user
function urlsForUser(id){
  let temp = {};
  for(let key in urlDatabase){
    if(urlDatabase[key]['userID'] === id){
      temp[key] = urlDatabase[key];
    }
  }
  return temp;
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
    res.render('error', errorPageSetup(400, 'Enter a valid email or password. Register again!'));
  } else{
    const user = findUserByEmail(req.body.email);
    if(user){
      res.statusCode = 400;
      res.render('error', errorPageSetup(400, 'User already exists. Register with a different email!'));
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
  if(user){
    if (bcrypt.compareSync(req.body.password, user.password)){
      req.session.id = user.id;
      res.redirect('/urls');
    } else{
      res.statusCode = 403;
      res.render('error', errorPageSetup(403, 'Email or password does not match. Please log-in again.'));
    }
  } else {
    res.statusCode = 403;
    res.render('error', errorPageSetup(403, 'User does not exists. Register to create an account.'));
  }
});

//POST - Logout : Logs the user out and clears the cookie
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

//GET - Add : Add a new URL
app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

//GET - Display : Displays all the urls
app.get("/urls", (req, res) => {
    res.render("urls_index");
});

//POST - Add : Redirects the url to /u/shorturl after generating and assigning a random string to longURL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].userID = req.session.id;
    urlDatabase[shortURL].url = req.body.longURL;
    console.log(urlDatabase);
    res.redirect(`urls/${shortURL}`);
  //}
});

//GET - Edit : Shows an Edit page for a id url
app.get("/urls/:id", (req, res) => {
    if(!urlDatabase[req.params.id]){
      res.statusCode = 404;
      res.send("Error 404 : Page not found");
    } else {
      if(urlDatabase[req.params.id].userID === req.session.id){
      let temp = { shortURL: req.params.id, url: urlDatabase[req.params.id].url, user: users[req.session.id]};
      res.render("urls_show", temp);
    } else {
      res.statusCode = 403;
      res.end("You are trying to access the url that doesn't belong to you.");
    }
    }

  //}
});
//POST - Edit : Redirects to /urls:id after updating the selected url in the database
app.post("/urls/:id", (req, res) => {
    if(!urlDatabase[req.params.id]){
      res.statusCode = 404;
      res.send("Error 404 : Page not found");
    }
    if(urlDatabase[req.params.id].userID === req.session.id){
      urlDatabase[req.params.id].url = req.body.editURL;
      res.redirect(`/urls/${req.params.id}`);
    } else {
      res.statusCode = 403;
      res.end("You are trying to access the url that doesn't belong to you.");
    }

});

//POST - Delete : Redirects to /urls after the deleting the selected url from the database
app.post('/urls/:id/delete', (req, res) => {
    if(!urlDatabase[req.params.id]){
      res.statusCode = 404;
      res.send("Error 404 : Page not found");
    }
    if(urlDatabase[req.params.id].userID === req.session.id){
      delete urlDatabase[req.params.id];
      res.redirect('/urls');
    } else {
      res.statusCode = 403;
      res.end("You are trying to access the url that doesn't belong to you.");
    }
});

//middle link for redirecting from shorturl to corresponding webpage
app.get("/u/:id", (req, res) => {
  if(!urlDatabase[req.params.id]){
    res.statusCode = 404;
    res.send("Error 404 : Page not found");
  } else {
    res.redirect(urlDatabase[req.params.id].url);
  }

});

//Listen to the requests from browser at PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
