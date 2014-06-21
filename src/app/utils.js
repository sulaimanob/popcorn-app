var Utils = {};
var request = require('request');
var AdmZip = require('adm-zip');
var fs = require('fs');

Utils.downloadSubtitle = function(data) {
	console.log(data);
	var subUrl = data.url;
	var filePath = data.filePath;
	var fileExt = filePath.split('.').pop();
	var subExt = subUrl.split('.').pop();
	if(subExt === 'zip') {
		var zipPath = filePath.substring(0,filePath.lastIndexOf(fileExt)) + 'zip';

		var unzipPath = filePath.substring(0,filePath.lastIndexOf('.'+fileExt));
		unzipPath = unzipPath.substring(0, unzipPath.lastIndexOf('/'));
		var out = fs.createWriteStream(zipPath);
		var req = request(
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
		var out = fs.createWriteStream(srtPath);
		var req = request(
			{
				method: 'GET',
				uri: subUrl,
			}
		);

		req.pipe(out);
	}
	return;
}