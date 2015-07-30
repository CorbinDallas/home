var config = require('../config/default.json'),
    restify = require('restify'),
    request = require('request'),
    parse = require('url').parse,
    FeedParser = require('feedparser'),
    async = require('async'),
    fs = require('fs');
function getFeed(path, options, callback){
    var req = request(path),
        feedparser = new FeedParser(options),
        output = [];
        req.on('error', function(err){
            console.log('request error', err);
            callback(err);
        });
        req.on('response', function(res){
            var stream = this;
            if(res.statusCode !== 200){
                this.emit('error',new Error('Status ' + statusCode));
                return;
            }
            stream.pipe(feedparser);
        });
        feedparser.on('error', function(err){
            console.log('feed error ', err);
            callback(err);
        });
        feedparser.on('readable', function(){
            var stream = this,
                meta = stream.meta,
                item = stream.read();
            while(item){
                output.push(item);
                item = stream.read();
            }
        });
        feedparser.on('end', function(){
            callback(undefined, output);
        });
}
module.exports = function(callback){
    var layout = config.layout,
        procs = [],
        output = [],
        x = 0;
    layout.forEach(function(item){
        procs.push(function(done){
            var o = x++,
                url;
            if(item.type === 'rss'){
                getFeed(item.source, item.options, function(err, data){
                    if(err){
                        item.error = err;
                    }
                    if(item.options.removeSlashdotBullshit){
                        for(var x = 0; x < data.length; x++){
                            if (data &&
                                data[x] &&
                                data[x].description) {
                                data[x].description = data[x].description.split('\n')[0];
                            }
                        }
                    }
                    item.content = data;
                    output[o] = item;
                    done();
                });
            }else if(item.type === 'html'){
                url = parse(item.source);
                var client = restify.createStringClient({
                    url: url.protocol + '//' + url.host
                });
                client.get(url.path, function(err, req, res, data){
                    function afterPostProcess() {
                        output[o] = item;
                        item.content = new Buffer(data).toString('base64');
                        done();
                    }
                    if(err){
                        item.error = err;
                        done();
                    }else{
                        if(item.options.noScript){
                            var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
                            while (SCRIPT_REGEX.test(data)) {
                                data = data.replace(SCRIPT_REGEX, "");
                            }
                        }
                        if (item.options.useCustomCssFile) {
                            fs.readFile('./public/css/' + item.options.useCustomCssFile, function (err, css) {
                                var s = '';
                                if (err) {
                                    console.log('css load err', err);
                                } else {
                                    data = data.replace('</head>', '<style>' + css.toString() + '</style></head>');
                                }
                                afterPostProcess();
                            });
                        } else {
                            afterPostProcess();
                        }
                    }
                });
            }else{
                done();
            }
        });
    });
    async.parallel(procs, function(){
        callback(output);
    });
};