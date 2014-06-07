(function(App) {
    'use strict';

    var REQUIRED_SIZE_TO_PLAY = 10 * 1024 * 1024,
        BUFFER_SIZE = 1.5 * 1024 * 1024;

    var readTorrent = require('read-torrent'),
        peerflix = require('peerflix'),
        path = require('path'),
        mime = require('mime');

    var State = {
        Connecting:  'connecting',
        Starting:    'startingDownload',
        Downloading: 'downloading',
        Subtitles:   'waitingForSubtitles',
        Ready:       'ready'
    };
    Object.freeze(State);

    var engine = null,
        statsUpdater = null,
        subtitles = null,
        hasSubtitles = false;

    var watchState = function(stateModel) {
        if (!engine) {
            return;
        }

        var swarm = engine.swarm,
            pieceLength = engine.torrent ? engine.torrent.pieceLength : 0,
            state = State.Connecting;

        var amountDownloaded = Math.max(swarm.downloaded, swarm.piecesGot * pieceLength);

        if (amountDownloaded > REQUIRED_SIZE_TO_PLAY) {
            state = hasSubtitles ? State.Ready : State.Subtitles;
        } else if (swarm.downloaded || swarm.piecesGot > 0) {
            state = State.Downloading;
        } else if (swarm.wires.length) {
            state = State.Starting;
        }

        stateModel.set('state', state);

        if(state !== State.Ready) {
            _.delay(watchState, 100, stateModel);
        }
    };

    var handleTorrent = function(torrent, stateModel) {

        var temporaryFileName = torrent.info.infoHash.replace(/([^a-zA-Z0-9-_])/g, '_'),
            temporaryFile = path.join(App.settings.tmpLocation, temporaryFileName);

        win.debug('Streaming movie to %s', temporaryFile);

        engine = peerflix(torrent.info, {
            connections: parseInt(Settings.connectionLimit, 10) || 100, // Max amount of peers to be connected to.
            dht: parseInt(Settings.dhtLimit, 10) || 50,
            port: parseInt(Settings.streamPort, 10) || 0, 
            path: temporaryFile, // we'll have a different file name for each stream also if it's same torrent in same session
            buffer: BUFFER_SIZE.toString(), // create a buffer on torrent-stream
            index: torrent.file_index
        });

        engine.swarm.piecesGot = 0;
        engine.on('verify', function(index) {
            engine.swarm.piecesGot += 1;
            win.debug('Got piece #%d', index);
        });

        var streamInfo = new App.Model.TorrentStatus({engine: engine});

        // Fix for loading modal
        streamInfo.updateStatistics(engine);
        
        statsUpdater = setInterval(_.bind(streamInfo.updateStatistics, streamInfo, engine), 3000);
        stateModel.set('streamInfo', streamInfo);
        stateModel.set('state', State.Connecting);
        watchState(stateModel);

        var checkReady = function() {
            if(stateModel.get('state') === State.Ready) {

                streamInfo.set('subtitle', subtitles || torrent.subtitle);
                streamInfo.set('defaultSubtitle', torrent.defaultSubtitle);
                streamInfo.set('title', torrent.title);

                streamInfo.set('show_id', torrent.show_id);
                streamInfo.set('season', torrent.season);
                streamInfo.set('episode', torrent.episode);

                App.vent.trigger('stream:ready', streamInfo);
                stateModel.destroy();
            }
        };

        engine.server.on('listening', function(){
            if(!engine) {
                return;
            }

            streamInfo.set('src', 'http://127.0.0.1:' + engine.server.address().port + '/');
            streamInfo.set('type', 'video/mp4');

            // TEST for custom NW
            //streamInfo.set('type', mime.lookup(engine.server.index.name));
            stateModel.on('change:state', checkReady);
            checkReady();
        });
    };

    var isValidVideoFormat = function(fileName) {
        var extension = path.extname(fileName);
        return extension === '.avi'
            || extension === '.mp4'
            || extension === '.mkv';
    };

    var Streamer = {
        start: function(model) {
            var torrentUrl  = model.get('torrent');
            var torrent_read = model.get('torrent_read');
            
            var stateModel = new Backbone.Model({state: State.Connecting, backdrop: model.get('backdrop')});
            App.vent.trigger('stream:started', stateModel);

            if(engine) {
                Streamer.stop();
            }

            this.stop_ = false;
            var that = this;
            var doTorrent = function(error, torrent) {
                // Return if streaming was cancelled while loading torrent
                if (that.stop_) {
                    return;
                }

                if(error) {
                    App.vent.trigger('error', error);
                    App.vent.trigger('stream:stop');
                    return;
                }

                var getSubtitles = function(data){
                    win.debug('Subtitle data request:', data);

                    var subtitleProvider = new (App.Config.getProvider('tvshowsubtitle'))();

                    subtitleProvider.query(data, function(subs) {
                        var subtitleCount = Object.keys(subs).length;
                        subtitles = subtitleCount > 0 ? subs : null;
                        win.info('%d subtitled found', subtitleCount);
                        hasSubtitles = true;
                    });
                };

                var handleTorrent_fnc = function(){
                    // TODO: We should passe the movie / tvshow imdbid instead
                    // and read from the player
                    // so from there we can use the previous next etc
                    // and use all available function with the right imdb id

                    var torrentInfo = {
                        info: torrent,
                        subtitle: model.get('subtitle'),
                        defaultSubtitle: model.get('defaultSubtitle'),
                        title: title,
                        show_id: model.get('show_id'),
                        episode: model.get('episode'),
                        season: model.get('season'),
                        file_index: model.get('file_index')
                    };

                    handleTorrent(torrentInfo, stateModel);
                };

                var extractSubtitle = model.get('extract_subtitle');
                if (typeof extractSubtitle === 'object') {
                    extractSubtitle.filename = torrent.name;

                    var subskw = [];
                    for(var key in App.Localization.langcodes){
                        if (App.Localization.langcodes[key].keywords !== undefined) {
                            subskw[key] = App.Localization.langcodes[key].keywords;
                        }
                    }
                    extractSubtitle.keywords = subskw;

                    getSubtitles(extractSubtitle);
                }

                if(model.get('type') === 'movie') {
                    hasSubtitles = true;
                }

                //Try get subtitles for custom torrents
                var title = model.get('title');
                if(!title) { //From ctrl+v magnet or drag torrent

                    // Magnets do not have files, meaning we need to check if files
                    // exist before we filter.
                    if (torrent.files) {
                        torrent.files = _.filter(torrent.files, function(file) {
                            return isValidVideoFormat(file.name);
                        });
                    }

                    if(torrent.files && torrent.files.length > 1 && !model.get('file_index') && model.get('file_index') !== 0) {
                        torrent.files = $.grep(torrent.files, function(n) {
                            return(n);
                        });

                        var fileModel = new Backbone.Model({
                            torrent: torrent,
                            files: torrent.files
                        });

                        App.vent.trigger('system:openFileSelector', fileModel);
                    } else {
                        model.set('defaultSubtitle', Settings.subtitle_language);

                        var subtitleData = {};
                        if (torrent.name) { // sometimes magnets don't have names for some reason
                            title = $.trim(torrent.name.replace('[rartv]','')
                                    .replace('[PublicHD]','')
                                    .replace('[ettv]','')
                                    .replace('[eztv]',''))
                                .replace(/[\s]/g,'.');

                            subtitleData.filename = title;

                            var seasonEpisodeData = title.match(/(.*)S(\d\d)E(\d\d)/i);
                            if (seasonEpisodeData) {
                                var tvShowName = $.trim(seasonEpisodeData[1].replace(/[\.]/g,' '));
                                var trakt = new (App.Config.getProvider('metadata'))();
                                trakt.episodeDetail({
                                    title: tvShowName,
                                    season: seasonEpisodeData[2],
                                    episode: seasonEpisodeData[3]
                                }, function(error, data) {
                                    if(error || !data) {
                                        win.warn(error);
                                        getSubtitles(subtitleData);
                                    } else {
                                        $('.loading-background').css('background-image', 'url('+data.show.images.fanart+')');
                                        subtitleData.imdbid = data.show.imdb_id;
                                        subtitleData.season = data.episode.season.toString();
                                        subtitleData.episode = data.episode.number.toString();
                                        getSubtitles(subtitleData);
                                        model.set('show_id', data.show.tvdb_id);
                                        model.set('episode', subtitleData.season);
                                        model.set('season', subtitleData.episode);
                                        title = data.show.title + ' - ' + i18n.__('Season') + ' ' + data.episode.season + ', ' + i18n.__('Episode') + ' ' + data.episode.number + ' - ' + data.episode.title;
                                    }
                                    handleTorrent_fnc();
                                });
                            }else{
                                getSubtitles(subtitleData);
                                handleTorrent_fnc();
                            }
                        }
                        else {
                            handleTorrent_fnc();
                        }
                    }
                } else {
                    handleTorrent_fnc();
                }
            };

            if(!torrent_read) {
                readTorrent(torrentUrl, doTorrent);
            }
            else {
                doTorrent(null, model.get('torrent'));
            }

            
        },

        stop: function() {
            this.stop_ = true;
            if (engine) {
                if(engine.server._handle) {
                    engine.server.close();
                }
                engine.destroy();
            }
            clearInterval(statsUpdater);
            statsUpdater = null;
            engine = null;
            subtitles = null; // reset subtitles to make sure they will not be used in next session.
            hasSubtitles = false;
            win.info('Streaming cancelled');
        }
    };

    App.vent.on('stream:start', Streamer.start);
    App.vent.on('stream:stop', Streamer.stop);

})(window.App);