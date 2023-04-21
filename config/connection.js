const { MongoClient } = require("mongodb");
var db = null;
const url =
  "mongodb+srv://adarsh:adarsh@cluster1.6iztrde.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(url);

const dbName = "classroom";

module.exports.main= function() {
   client.connect();
  console.log("Connected successfully to server");
  db = client.db(dbName);
  // const collection = db.collection("documents");
  return db;
}
