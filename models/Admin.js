const sql = require('./db.js')
const bcrypt =require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('../config/config');

function makeDBQuery(query, arguments) {
    return new Promise((resolve, reject) => {
        sql.query(query, arguments, (err, result) => {
                if (err) {
                    return reject(err);
                }
  
                return resolve(result);
            }
        )
    })
  }
  


module.exports = { 
    login: async(credentials)=>{
        adminID = credentials[0]
        adminResult = await makeDBQuery("select id,password from admin where id = ?",adminResult)
        if(adminResult.length == 0){
            return null
        }
        const isMatch = await bcrypt.compare(credentials[1],result[0].password)
        if(!isMatch){
            return null
        }
        else{    
            return auth.createAdminToken(result[0])
        }
    },
    getSomeOrganizersInfo: async() =>{
        
        accountStatus = 0;
        result = await makeDBQuery("select id,name, email,description,phoneNumber,type where accountStatus = ?")
        return result;
    },
    // getSpecificOrganizerInfo:
}