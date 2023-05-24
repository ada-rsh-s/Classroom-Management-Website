const { MongoClient } = require("mongodb");
var db = null;
const url =
  "mongodb+srv://adarsh:adarsh@cluster1.6iztrde.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(url);
const dbName = "classroom";

module.exports.connect = function () {
  client.connect();
  return console.log("Connected successfully to server");
};

module.exports.get= function() {
  db = client.db(dbName);
  return db;
}
