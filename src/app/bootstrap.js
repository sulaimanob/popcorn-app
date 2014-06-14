(function(App) {
    'use strict';

    App.Caches = {
    	Model: new App.CacheV2('models')
    };

    App.start();
})(window.App);