(function(App) {
    'use strict';

    var healthMap = {
        0: 'bad',
        1: 'medium',
        2: 'good',
        3: 'excellent'
    };

    var Movie = Backbone.Model.extend({
        idAttribute: 'imdb',

        initialize: function() {
            var self = this;
            this._persistent = {};

            App.Caches.Model.get(this.get('imdb')).then(function(data) {
                if(data) {
                    self.set(data, {silent: true});
                    self._persistent = data;
                }
            });

            this.on('change:torrents', this.updateHealth);
            this.on('change', this.storePersistent);
        },

        storePersistent: function(model) {
            if(_.intersection(_.keys(model.changed), _.keys(this._persistent)).length > 0) {
                 _.extend(this._persistent, _.pick(model.changed, _.keys(this._persistent)));
                App.Caches.Model.set(this.get('imdb'), this._persistent, {ttl: Infinity});
            }
        },

        persist: function(key, val, options) {
            this._persistent[key] = val;
            this.set(key, val, options);
        },

        updateHealth: function() {
            var torrents = this.get('torrents');
            _.each(torrents, function(torrent) {
                if (!torrent.url) {

                    // we have a tv show
                    _.each(torrent, function(episode, key) {
                        // ok we have a movie
                        var seeds = episode.seeds;
                        var peers = episode.peers;
                        var ratio = peers > 0 ? (seeds / peers) : seeds;
                        var health = 0;
                        if (seeds >= 100 && seeds < 1000) {
                            if( ratio > 5 ) {
                                health = 2;
                            } else if( ratio > 3 ) {
                                health = 1;
                            }
                        } else if (seeds >= 1000) {
                            if( ratio > 5 ) {
                                health = 3;
                            } else if( ratio > 3 ) {
                                health = 2;
                            } else if( ratio > 2 ) {
                                health = 1;
                            }
                        }

                        torrent[key].health = healthMap[health];

                    });

                } else {

                    // we have a movie
                    var seeds = torrent.seeds;
                    var peers = torrent.peers;
                    var ratio = peers > 0 ? (seeds / peers) : seeds;
                    var health = 0;
                    if (seeds >= 100 && seeds < 1000) {
                        if( ratio > 5 ) {
                            health = 2;
                        } else if( ratio > 3 ) {
                            health = 1;
                        }
                    } else if (seeds >= 1000) {
                        if( ratio > 5 ) {
                            health = 3;
                        } else if( ratio > 3 ) {
                            health = 2;
                        } else if( ratio > 2 ) {
                            health = 1;
                        }
                    }

                    torrent.health = healthMap[health];
                }


            });

            this.set('torrents', torrents, {silent: true});
        }
    });

    App.Model.Movie = Movie;
})(window.App);