import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import studentHelpers from "./helpers/studentHelpers.js";
import tutorHelpers from "./helpers/tutorHelpers.js";
import logger from "morgan";
import http from "http";
import usersRouter from "./routes/student.js";
import tutorRouter from "./routes/tutor.js";
import { Server } from "socket.io";
import db from "./config/connection.js";
import collection from "./config/collections.js";
import fileUpload from "express-fileupload";
import session from "express-session";
import hbs from "express-handlebars";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); 
const server = http.createServer(app);
const io = new Server(server);

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
    const objtopi = {
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
// app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());
app.use(session({
  secret: "Key",
  resave: false,  
  saveUninitialized:false,
  cookie: { maxAge: 3600000 }
}));
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

export {app, server}; 