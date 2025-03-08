import { MongoClient } from "mongodb";
var db = null;
const url =
  "mongodb+srv://adarsh:adarsh@cluster1.6iztrde.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(url);
const dbName = "classroom";

const connect=()=>{ 
  client.connect();
  return console.log("Connected successfully to server");
};

const get=()=>{ 
  db = client.db(dbName);
  return db;
}

export default {connect, get};
