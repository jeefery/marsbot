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
//intentDialog.onDefault(builder.DialogAction.send('Sorry, I didn\'t understand that.'));
//intentDialog.matches('Greeting', '/greetingDialog');
//intentDialog.matches('Size', '/sizeDialog')
//intentDialog.matches('Distance', '/distanceDialog');
//intentDialog.matches('Life', 'lifeDialog');

intentDialog.matches(/\b(hi|hello|hey|howdy)\b/i, '/sayHi') //Check for greetings using regex
    .matches('GetNews', '/topnews') //Check for LUIS intent to get news
    //.matches('AnalyseImage', '/analyseImage') //Check for LUIS intent to analyze image
    .onDefault(builder.DialogAction.send("Sorry, I didn't understand what you said.")); //Default message if all checks fail

bot.dialog('/sayHi', function(session) {
    session.send('Hi there!  Try saying things like "Get news in Toyko"');
    session.endDialog();
});

/*bot.dialog('/topNews', [
    function (session){
        // Ask the user which category they would like
        // Choices are separated by |
        builder.Prompts.choice(session, "Which category would you like?", "Technology|Science|Sports|Business|Entertainment|Politics|Health|World|(quit)");
    }, function (session, results){
        var userResponse = results.response.entity;
        session.endDialog("You selected: " + userResponse);
    }
]);
*/

bot.dialog('/topnews', [
    function (session){
        // Ask the user which category they would like
        // Choices are separated by |
        builder.Prompts.choice(session, "Which category would you like?", "Technology|Science|Sports|Business|Entertainment|Politics|Health|World|(quit)");
    }, function (session, results, next){
        // The user chose a category
        if (results.response && results.response.entity !== '(quit)') {
           //Show user that we're processing their request by sending the typing indicator
            session.sendTyping();
            // Build the url we'll be calling to get top news
            var url = "https://api.cognitive.microsoft.com/bing/v5.0/news/?" 
                + "category=" + results.response.entity + "&count=10&mkt=en-US&originalImg=true";
            // Build options for the request
            var options = {
                uri: url,
                headers: {
                    'Ocp-Apim-Subscription-Key': BINGSEARCHKEY
                },
                json: true // Returns the response in json
            }
            //Make the call
            rp(options).then(function (body){
                // The request is successful
                //console.log(body); // Prints the body out to the console in json format
                //session.send("Managed to get your news.");
                // Call SendTopNews
                sendTopNews(session, results, body);
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
            session.endDialog("Ok. Mission Aborted.");
        }
    }
]);

// This is called the root dialog. It is the first point of entry for any message the bot receives
/*bot.dialog('/', function (session) {
    // Send 'hello world' to the user
    session.send("Hello World");
});*/

// This function processes the results from the API call to category news and sends it as cards
function sendTopNews(session, results, body){
    session.send("Top news in " + results.response.entity + ": ");
    //Show user that we're processing by sending the typing indicator
    session.sendTyping();
    // The value property in body contains an array of all the returned articles
    var allArticles = body.value;
    var cards = [];
    // Iterate through all 10 articles returned by the API
    for (var i = 0; i < 10; i++){
        var article = allArticles[i];
        // Create a card for the article and add it to the list of cards we want to send
        cards.push(new builder.HeroCard(session)
            .title(article.name)
            .subtitle(article.datePublished)
            .images([
                //handle if thumbnail is empty
                builder.CardImage.create(session, article.image.contentUrl)
            ])
            .buttons([
                // Pressing this button opens a url to the actual article
                builder.CardAction.openUrl(session, article.url, "Full article")
            ]));
    }
    var msg = new builder.Message(session)
        .textFormat(builder.TextFormat.xml)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);
    session.send(msg);
}