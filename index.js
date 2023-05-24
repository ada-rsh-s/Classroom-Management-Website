var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
const studentHelpers = require("./helpers/studentHelpers");
const tutorHelpers = require("./helpers/tutorHelpers");
var logger = require("morgan");
var http = require("http");
var usersRouter = require("./routes/user");
var tutorRouter = require("./routes/tutor");
var hbs = require("express-handlebars");
var app = express("express-session");
const server = http.createServer(app);
var io = require("socket.io")(server);
var db = require("./config/connection");
const collection = require("./config/collections");

db.connect();

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("Connection Closed");
  });

  socket.on("pvtchat", async (data) => {
    await studentHelpers.findPvtChat(data.userId).then((details) => {
      data.name = details.Name;
    });
    studentHelpers.pvtChat(data.name, data.message, data.chatId, data.userId);
    io.emit(data.chatId, [data]);
  });
  socket.on("message", (topic, type) => {
    let date =
      ("0" + new Date().getDate()).slice(-2) +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    var objtopi = {
      topic: topic,
      type: type,
      Date: date,
    };
    db.get().collection(collection.NOTI_COLLECTION).insertOne(objtopi);
    io.emit("topicassign", topic, type, date);
  });

  socket.on("input", async (data) => {
    let details;
    let date =
      ("0" + new Date().getDate()).slice(-2) +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    if (data.type) {
      await tutorHelpers.findPvtChat(data.tutorId).then((datamsg) => {
        details = datamsg;
      });
      data.date = date;
      data.name = details.Firstname + " " + details.Lastname + " (TUTOR)";
      let message = data.message;
      studentHelpers.chat(data.name, details._id, message, date);
      io.emit("output", [data]);
    } else {
      await studentHelpers.findPvtChat(data.userId).then((datamsg) => {
        details = datamsg;
      });
      data.date = date;
      data.name = details.Name;
      let message = data.message;
      studentHelpers.chat(details.Name, details._id, message, date);
      io.emit("output", [data]);
    }
  });
});

var fileUpload = require("express-fileupload");
var session = require("express-session");
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/Layout/",
    partialsDir: __dirname + "/views/Partials/",
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());
app.use(session({ secret: "Key", cookie: { maxAge: 3600000 } }));
app.set("socketio", io);

app.use("/", usersRouter);
app.use("/tutor", tutorRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = { app: app, server: server };
