const mysql = require("mysql");


var connection;
// Create a connection to the database
  if(process.env.JAWSDB_URL) {  
    connection = mysql.createConnection(process.env.JAWSDB_URL);
} 
  else {
  //otherwise, we're going to use our local connection!  put your local db set stuff here
  //(and remember our best practice of using the dotenv package and a .env file ;)
  connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'eventlocator_dev'
});
}
connection.connect(error => {
    if (error) throw error;
    console.log("Successfully connected to the database.");
  });
  
module.exports = connection  