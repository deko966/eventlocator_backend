const mysql = require("mysql");
const dbConfig = require("../config/DB.js");

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'bmlx3df4ma7r1yh4.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
  user: 'rdy8jeb4kq2r499d',
  password: 'f28na29osz7i9uco',
  database: 'iifg7gg8zgz54yaa'
});
connection.connect(error => {
    if (error) throw error;
    console.log("Successfully connected to the database.");
  });
  
module.exports = connection  