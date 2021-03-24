const mysql = require("mysql");
const dbConfig = require("../config/DB.js");

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'eventlocator_dev'
});
connection.connect(error => {
    if (error) throw error;
    console.log("Successfully connected to the database.");
  });
  
module.exports = connection  