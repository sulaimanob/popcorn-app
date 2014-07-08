(function(App) {
    'use strict';
    var Q = require('q');

    var Favorites = function() {};

    Favorites.prototype = new App.Providers.Eztv();
    Favorites.prototype.constructor = Favorites;

    var queryTorrents = function(filters) {
        var deferred = Q.defer();

        App.db.getBookmarks(filters, function(err, data) {
            deferred.resolve(data || []);
        });

        return deferred.promise;
    };

    var formatForPopcorn = function(items) {
        var d = Q.defer();
        var movieList = [];

        items.forEach(function(movie) {

            var deferred = Q.defer();
            // we check if its a movie 
            // or tv show then we extract right data
            if (movie.type === 'movie') {
                // its a movie
                Database.getMovie(movie.imdb_id, function(err,data) {
                    if (data != null) {                        
                        data.type = 'movie';
                        data.provider = 0; // TODO : change the 0 with the right provider (it works because right now, there's only one provider)
                        deferred.resolve(data);   
                    } else {
                        deferred.reject(err);
                    }
                });

            } else {
                // its a tv show
                Database.getTVShowByImdb(movie.imdb_id, function(err,data) {
                    if (data != null) {                        
                        data.type = 'tvshow';

                        data.image = data.images.poster;
                        data.imdb = data.imdb_id;
                        data.provider = 0; // TODO : change the 0 with the right provider (it works because right now, there's only one provider)
                        deferred.resolve(data);   
                    } else {
                        deferred.reject(err);
                    }                 
                });
            }

            movieList.push(deferred.promise);
        });

        Q.all(movieList).done(function (results) {
            return d.resolve({results: results, hasMore: false});
        });

        return d.promise;
    };    

    Favorites.prototype.extractIds = function(items) {
        return _.pluck(items.results, 'imdb_id');
    };

    Favorites.prototype.fetch = function(filters) {
        return queryTorrents(filters)
            .then(formatForPopcorn);
    };    

    App.Providers.Favorites = Favorites;

})(window.App);