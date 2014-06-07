(function(App) {
    'use strict';

	var BUFFERING_SIZE = 10 * 1024 * 1024;

	var active = function(wire) {
		return !wire.peerChoking;
	};

	var prettifySpeed = function(speed) {
		if (isNaN(speed) || speed <= 0) {
			return '0 b/s';
		}

		var fileSizes = ['b', 'kb', 'mb', 'gb', 'tb'];

		var converted_speed = Math.floor( Math.log(speed) / Math.log(1024) );
		return (speed / Math.pow(1024, converted_speed)).toFixed(2) + ' ' + fileSizes[converted_speed] + '/s';
	};

    var TorrentStatus = Backbone.Model.extend({
        updateStatistics: function(engine) {

			var swarm = engine.swarm;

			var uploadSpeed = prettifySpeed(swarm.uploadSpeed());
			var downloadSpeed = prettifySpeed(swarm.downloadSpeed());

			this.set('pieces', swarm.piecesGot);
			this.set('downloaded', swarm.downloaded);
			this.set('active_peers', swarm.wires.filter(active).length);
			this.set('total_peers', swarm.wires.length);

			this.set('uploadSpeed', uploadSpeed);
			this.set('downloadSpeed', downloadSpeed);

			swarm.downloaded = (swarm.downloaded) ? swarm.downloaded : 0;

			var percent = swarm.downloaded / (BUFFERING_SIZE / 100);
			if(percent >= 100) {
				percent = 99; // wait for subtitles
			}

			this.set('percent', percent);
        }
    });

    App.Model.TorrentStatus = TorrentStatus;
})(window.App);
