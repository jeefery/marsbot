// Reference the packages we require so that we can use them in creating the bot
var restify = require('restify');
var builder = require('botbuilder');
var rp = require('request-promise');
//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
// Listen for any activity on port 3978 of our local server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
// If a Post request is made to /api/messages on port 3978 of our local server, then we pass it to the bot connector to handle
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================
//var luisRecognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/3833fb80-f8c7-4b1c-8c74-ff20b3c27a49?subscription-key=ca5c9f35976046cdb54990c74eac60da&staging=true&verbose=true&timezoneOffset=0&q=');
//var intentDialog = new builder.IntentDialog({recognizers: [luisRecognizer]});
var BINGSEARCHKEY = 'c228cfc5d0c2488ba1c1b40ee7347c01';
var luisUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/3833fb80-f8c7-4b1c-8c74-ff20b3c27a49?subscription-key=ca5c9f35976046cdb54990c74eac60da&staging=true&verbose=true&timezoneOffset=0&q=';
var luisRecognizer = new builder.LuisRecognizer(luisUrl);
var intentDialog = new builder.IntentDialog({recognizers: [luisRecognizer]});

//Root dialog
bot.dialog('/', intentDialog);
intentDialog.onDefault(builder.DialogAction.send('Sorry, I didn\'t understand that.'));
intentDialog.matches(/\b(hi|hello|hey|howdy)\b/i, '/greetingDialog');

bot.dialog('/greetingDialog', [
    function (session){
        // Ask the user which category they would like
        // Choices are separated by |
        builder.Prompts.choice(session, "Hi!! Welcome Proton Auto Assist!  Have a problem which you cars? Please choose your problem'", "Engine|Door|Lamp|Steering|Others|(quit)");
    }, function (session, results, next){
        // The user chose a category
        if (results.response && results.response.entity !== '(quit)') {
           //Show user that we're processing their request by sending the typing indicator
            session.sendTyping();
            session.send("Searching our database");
            //Make the call
            rp(options).then(function (body){
                // The request is successful
                //console.log(body); // Prints the body out to the console in json format
                //session.send("Nothing found.");
            }).catch(function (err){
                // An error occurred and the request failed
                console.log(err.message);
                session.send("Argh, something went wrong. :( Try again?");
            }).finally(function () {
                // This is executed at the end, regardless of whether the request is successful or not
                session.endDialog();
            });
        } else {
            // The user choses to quit
            session.endDialog("Ok. Thank you and nice to meet you.");
        }
    }
]);
