const mongoClient = require("mongodb").MongoClient;
const state = {
  db: null,
};
module.exports.connect = function (done) {
  const url = "mongodb+srv://adarsh:adarsh@cluster1.6iztrde.mongodb.net/test";
  const dbname = "classroom";
  mongoClient.connect(url, { useUnifiedTopology: true }, (err, data) => {
    if (err) return done(err);
    state.db = data.db(dbname);
  });

  done();
};

module.exports.get = function () {
  console.log(state.db);
  return state.db;
};
