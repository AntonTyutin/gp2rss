require.paths.push('./vendor');
var http = require('http');
var https = require('https');
var rss = require('rss');
var config = require('./config.json');

// $ curl 'http://localhost:8001/107379082251932393598'

var server = http.createServer(function (request, response) {
	var idParseResult = request.url.match(/^\/(\d+)/);
	if (!idParseResult) {
		response.end();
		return;
	}
	var userId = idParseResult[1];
	var options = {
		host: 'www.googleapis.com',
		port: 443,
		path: '/plus/v1/people/' + userId + '/activities/public?key=' + config.apiKey
	};
	var client = https.get(options, function (googleResponse) {
		var json = '';
		googleResponse.on('data', function (body) {
			json += body;
		});
		googleResponse.on('close', function () {
			var data = JSON.parse(json);
			var feed = new rss({
				title: data['title'],
				feed_url: 'https://plus.google.com/u/0/' + userId + '/posts',
				site_url: 'https://plus.google.com',
				image_url: 'https://ssl.gstatic.com/s2/oz/images/faviconr.ico'
//				author: 'Dylan Greene'
			});
			for (var i in data['items']) {
				var item = data['items'][i];
				var obj = item['object'];
				var addLinks = '';
				if (obj['attachments']) {
					for (var j in obj['attachments']) {
						var url = obj['attachments'][j]['url'];
						addLinks += ' \u003ca href="' + url + '" \u003e' + url + '\u003c/a\u003e';
					}
				}
				feed.item({
					title:  item['title'],
					description: obj['content'] + addLinks,
					url: obj['url'],
					guid: item['id'],
					author: item['actor']['displayName'],
					date: item['published']
				});
			}
			response.end(feed.xml());
		});
	});
});

server.listen(8001);