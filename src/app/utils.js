var Utils = {};
var request = require('request');
var AdmZip = require('adm-zip');
var fs = require('fs');
var Q = require('q');
var async = require('async');

var externalPlayers = ['VLC', 'MPlayer OSX Extended'];

Utils.downloadSubtitle = function(data) {
	console.log(data);
	var subUrl = data.url;
	var filePath = data.filePath;
	var fileExt = filePath.split('.').pop();
	var subExt = subUrl.split('.').pop();
	var out = '';
	var req = null;
	if(subExt === 'zip') {
		var zipPath = filePath.substring(0,filePath.lastIndexOf(fileExt)) + 'zip';

		var unzipPath = filePath.substring(0,filePath.lastIndexOf('.'+fileExt));
		unzipPath = unzipPath.substring(0, unzipPath.lastIndexOf('/'));
		out = fs.createWriteStream(zipPath);
		req = request(
			{
				method: 'GET',
				uri: subUrl,
			}
		);

		req.pipe(out);
		req.on('end', function() {
			var zip = new AdmZip(zipPath),
			zipEntries = zip.getEntries();
			zip.extractAllTo(/*target path*/unzipPath, /*overwrite*/true);
			fs.unlink(zipPath, function(err){});
		});
	}
	else if(subExt === 'srt') {
		var srtPath = filePath.substring(0,filePath.lastIndexOf(fileExt)) + 'srt';
		out = fs.createWriteStream(srtPath);
		req = request(
			{
				method: 'GET',
				uri: subUrl,
			}
		);

		req.pipe(out);
	}
	return;
};

Utils.findExternalPlayers = function() {
	var defer = Q.defer();
	var folderName = '/Applications';
	var players = [];
	fs.readdir(folderName, function(err, data) {
		if(err) {
			defer.reject(err);
		}
		async.forEach(
			data, 
			function(d, cb) {
				if(externalPlayers.indexOf(d.replace('.app', '')) !== -1) {
					players.push({name: d.replace('.app', ''), path: folderName + '/' + d});
				}
				cb();
			},
			function(err, data) {
				defer.resolve(players);
			}
		);
	});
	return defer.promise;
};