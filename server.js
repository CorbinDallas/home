var config = require('./config/default.json'),
    Express = require('express'),
    handlebars = require('handlebars'),
    getItems = require('./lib/getItems'),
    fs = require('fs'),
    restify = require('restify'),
    parse = require('url').parse,
    app = new Express();
function getItem(itemTitle) {
    for(var x = 0; x < config.layout.length; x++ ){
        if(config.layout.title === itemTitle) {
            return config.layout;
        }
    };
}
app.config = config;
app.use(Express.static(__dirname + '/public'));
app.get('/proxy', function(req, res, next){
    var url = parse(req.headers['x-get-url']);
    var item = getItem(req.headers['x-item-title']);
    var client = restify.createStringClient({
        url: url.protocol + '//' + url.host
    });
    client.get(url.path, function(err, creq, cres, data){
        if (err) {
            res.send(new Buffer(err).toString('base64'));
        } else {
            res.send(new Buffer(data).toString('base64'));    
        }
    });
});
app.get('/', function(req, res, next){
    fs.readFile(__dirname + '/views/index.handlebars', function(err, data){
        var template = handlebars.compile(data.toString());
        res.send(template());
    });
});
app.get('/getItems.js', function(req, res, next){
   fs.readFile(__dirname + '/views/main.handlebars', function(err, data){
        getItems(function(output){
            var template = handlebars.compile(data.toString());
            res.header({
                'content-type': 'text/javascript'
            }).send(template({
                main: JSON.stringify(output, true),
                style: JSON.stringify(config.style, true)
            }));
        });
    });
});
app.listen(config.port);