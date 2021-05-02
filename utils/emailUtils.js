const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(require('../config/config').sendgridAPIKey)

module.exports = {
    sendOneEmail: (to, subject, text) => {
        sgMail.send({
            from: "EventLocatorJo@gmail.com",
            to: to,
            subject: subject,
            text: text
        }).then(() => {
            console.log("Sent email")
        }).catch(error => {
            console.log(error)
        })
    },
    sendMultipleEmails: (to, subject, text) => {
        sgMail.sendMultiple({
            from: "EventLocatorJo@gmail.com",
            to: to,
            subject: subject,
            text: text
        }).then(() => {
            console.log("Sent emails")
        }).catch(error => {
            console.log(error)
        })
    }
}