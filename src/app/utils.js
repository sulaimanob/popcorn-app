var Utils = {};
var request = require('request');
var AdmZip = require('adm-zip');
var fs = require('fs');
var Q = require('q');
var async = require('async');

var externalPlayers = ['VLC', 'MPlayer OSX Extended'];
var playerCmds = [];
var subsSwitch = [];
playerCmds['VLC'] = '/Contents/MacOS/VLC';
playerCmds['MPlayer OSX Extended'] = '/Contents/MacOS/MPlayer OSX Extended';

subsSwitch['VLC'] = ' --sub-filter=marq --marq-marquee="Streaming From Popcorn Time" --marq-position=8 --marq-timeout=3000 --sub-file=';
subsSwitch['MPlayer OSX Extended'] = ' -sub ';

Utils.downloadSubtitle = function(data) {
	var subUrl = data.url;
	var filePath = data.filePath;
	var fileFolder = filePath.substring(0, filePath.lastIndexOf('/'));
	var fileExt = filePath.split('.').pop();
	var subExt = subUrl.split('.').pop();
	var out = '';
	var req = null;

	fs.mkdirSync(fileFolder);
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
			win.debug('Subtitle extracted to : '+ unzipPath);
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
		req.on('end', function() {
			win.debug('Subtitle downloaded to : '+ srtPath);
		});
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

Utils.getPlayerName = function(path) {
	return path.split('/').pop().replace('.app', '').replace('.exe', '');
};

Utils.getPlayerCmd = function(path) {
	var name = Utils.getPlayerName(path);
	return playerCmds[name];
};

Utils.getSubtitleSwtich = function(path) {
	var name = Utils.getPlayerName(path);
	for(var p in externalPlayers) {
		if(name.toLowerCase() === externalPlayers[p].toLowerCase()) {
			return subsSwitch[externalPlayers[p]];
		}
	}
	return '';
};