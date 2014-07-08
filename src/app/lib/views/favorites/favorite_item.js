(function(App) {
    'use strict';
     
    var FavoriteItem = Backbone.Marionette.ItemView.extend({
        template: '#favorite-item-tpl',

        tagName: 'li',
        className: 'bookmark-item',

        ui: {
            coverImage: '.cover-image',
            cover: '.cover',
            bookmarkIcon: '.actions-favorites'
        },

        events: {
            'click .actions-favorites': 'toggleFavorite',
            'click .cover': 'showDetail'
        },

        onShow: function() {
            this.ui.coverImage.on('load', _.bind(this.showCover, this));
            this.ui.bookmarkIcon.addClass('selected');
        },

        onClose: function() {
            this.ui.coverImage.off('load');
        },

        showCover: function() {
            this.ui.cover.css('background-image', 'url(' + this.model.get('image') + ')');
            this.ui.cover.css('opacity', '1');
            this.ui.coverImage.remove();
        },
        showDetail: function(e) {
            e.preventDefault();

            if (this.model.get('type') === 'movie') {
                _.bind(App.View.MovieItem.showDetail, this);
                return App.View.MovieItem.showDetail();
            } else {
                _.bind(App.View.ShowItem.showDetail, this);
                return App.View.ShowItem.showDetail ();
            }

        },

        toggleFavorite: function(e) {
            e.stopPropagation();
            e.preventDefault();
            var that = this;
         
            Database.deleteBookmark(this.model.get('imdb'), function(err, data) {
                App.userBookmarks.splice(App.userBookmarks.indexOf(that.model.get('imdb')), 1);
                win.info('Bookmark deleted (' + that.model.get('imdb') + ')');
                if (that.model.get('type') === 'movie') {
                    // we'll make sure we dont have a cached movie
                    Database.deleteMovie(that.model.get('imdb'),function(err, data) {});
                } 

                // we'll delete this element from our list view
                $(e.currentTarget).closest( 'li' ).animate({ width: '0%', opacity: 0 }, 1000, function(){$(this).remove();
                    if($('.bookmarks li').length === 0) {
                        App.vent.trigger('movies:list', []);
                    }
                });
            });
            
        }

    });

    App.View.FavoriteItem = FavoriteItem;
})(window.App);
