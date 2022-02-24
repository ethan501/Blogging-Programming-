const dotenv = require("dotenv");

dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");

const session = require("cookie-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const secret = process.env.SECRET;

app.use(
  session({
    name: "session",
    keys: [
      "This is top secret "+ process.env.COOKEU_KEY1, +"and one more secret"
    ],
  })
);

app.use(passport.initialize());
app.use(passport.session());

const homeStartingContent =
  "Welcome to this blog site. Feel free to add content by pressing the compose button. This website was created to share opinions on the internet. Please be responsible.";

/* const connectionPassword = process.env.CONNECTIONSTRINGPASSWORD; */

mongoose.connect(
  "mongodb+srv://blogSite:"+process.env.MONGOOSE_PASSWORD+"@cluster0.oakkp.mongodb.net/blogDataBase2?retryWrites=true&w=majority"
);



const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* const user1 = new User({
  username: "Ethan",
  password: "Test",
});

user1.save()
 */

const postSchema = {
  title: String,
  content: String,
  username: String,
};

const Post = mongoose.model("Post", postSchema);
let posts = [];

let currentUser = "";

app.use(function (req, res, next) {
  currentUser = req.user;

  next();
});

app.get("/", function (req, res) {
  if (req.isAuthenticated()) {
    Post.find({}, function (err, posts) {
      if (!err) {
        res.render("home", {
          startingContent: homeStartingContent,
          posts: posts,
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/", function (req, res) {
  const postID = req.body.delete;
  Post.deleteOne({ _id: postID }, function (err) {
    if (err) return handleError(err);
  });
  res.redirect("/");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        res.render("register", { err: err });
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/");
        });
      }
    }
  );
});

app.get("/guestHome", function (req, res) {
  Post.find({}, function (err, posts) {
    if (!err) {
      res.render("guestHome", {
        posts: posts,
      });
    }
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/loggedInContact", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("loggedInContact");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      });
    }
  });
});

app.get("/contact", function (req, res) {
  res.render("contact");
});

app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

app.post("/compose", function (req, res) {
  post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    username: currentUser.username,
  });
  post.save(function (err) {
    if (!err) {
      posts.push(post);
    }
    res.redirect("/");
  });
});

app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;

  Post.findById(requestedPostId, function (err, post) {
    if (!err) {
      res.render("post", {
        title: post.title,
        content: post.content,
      });
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.set("port", port);

app.listen(port);
