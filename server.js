const exphbs = require("express-handlebars")
var express = require("express")
const clientSessions = require("client-sessions")
const { Client } = require("pg")
var app = express()
app.set("view engine", ".hbs")
var HTTP_PORT = process.env.PORT || 8080
require("dotenv").config()

//allows us to access files within public and views
app.use(express.static("public"))
app.use(express.static("views"))
//allows us to read from the body
app.use(express.urlencoded({ extended: true }))

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: (url, options) => {
        return (
          "<li" +
          (url == app.locals.activeRoute
            ? ' class="nav-item active" '
            : ' class="nav-item" ') +
          '><a class="nav-link" href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        )
      },

      equal: (lvalue, rvalue, options) => {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters")
        if (lvalue != rvalue) {
          return options.inverse(this)
        } else {
          return options.fn(this)
        }
      },
    },
  })
)

//to fix the highlighting of the nav
app.use((req, res, next) => {
  let route = req.path.substring(1)
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""))
  next()
})

//setting up cookie
app.use(
  clientSessions({
    cookieName: "capsession",
    secret: "cap805_cc",
    duration: 60 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
  })
)

//database connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
const client = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: true,
})

client.connect((err) => {
  if (err) {
    console.log("\n\n\n" + err.message + "\n\n\n")
  } else {
    console.log("\n\n\nsuccessfully connected to DB!!!!\n\n\n")
  }
})

//database query testing
var posts = ""
client
  .query("SELECT content, TO_CHAR(created_on, 'Mon dd, yyyy') FROM post")
  .then((result) => {
    posts = result.rows
    console.log(result.rows)
  })
  .catch((err) => {
    console.log(err.message)
  })

//get all the categories
var categories = ""
client
  .query("SELECT * FROM category")
  .then((result) => {
    categories = result.rows
    // console.log(categories)
  })
  .catch((err) => {
    console.log(err.message)
  })

var replies = ""

client
  .query("SELECT post_id, COUNT(post_id) FROM reply GROUP BY post_id")
  .then((result) => {
    replies = result.rows
    console.log(replies)
  })
  .catch((err) => {
    console.log(err.message)
  })

//Routes
app.get("/", (req, res) => {
  res.render("home", { forumPost: posts })
})

app.get("/contact", (req, res) => {
  res.render("contact")
})

app.get("/register", (req, res) => {
  res.render("register")
})

app.get("/login", (req, res) => {
  res.render("login")
})

app.get("/categories", (req, res) => {
  res.render("categories", { Categories: categories })
})

app.get("/topthreads", (req, res) => {
  res.render("topthreads")
})

app.get("/profile", (req, res) => {
  res.render("profile")
})

app.get("/account", (req, res) => {
  res.render("account")
})

app.get("/notifications", (req, res) => {
  res.render("notifications")
})

app.listen(HTTP_PORT, () => {
  console.log("server listening on port: " + HTTP_PORT)
})
