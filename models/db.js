const mysql = require("mysql");


var connection;
// Create a connection to the database
  if(process.env.JAWSDB_URL) {  
    console.log(process.env.JAWSDB_URL)
    connection = mysql.createConnection(process.env.JAWSDB_URL);
} 
  else {
  //otherwise, we're going to use our local connection!  put your local db set stuff here
  //(and remember our best practice of using the dotenv package and a .env file ;)
  connection = mysql.createConnection({
    host: 'bmlx3df4ma7r1yh4.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'rdy8jeb4kq2r499d',
    password: 'f28na29osz7i9uco',
    database: 'iifg7gg8zgz54yaa'
});
}
connection.connect(error => {
    if (error) throw error;
    console.log("Successfully connected to the database.");
  });
  
module.exports = connection  