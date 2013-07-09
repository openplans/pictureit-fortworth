/*globals Backbone Handlebars $ _ Swiper Modernizr */

var VisionLouisville = VisionLouisville || {};

(function(NS) {
  // Router ===================================================================
  NS.Router = Backbone.Marionette.AppRouter.extend({
    appRoutes: {
      'visions/:category/new': 'new',
      'visions/:category/list': 'list',
      'visions/:id': 'item',
      '': 'home'
    }
  });

  NS.controller = {
    list: function(category) {
      var render = function() {
        NS.app.mainRegion.show(new NS.VisionListView({
          model: new Backbone.Model({category: category}),
          collection: new Backbone.Collection(
            NS.app.visionCollection.filter(function(model) {
              return model.get('category').toLowerCase() === category;
            })
          )
        }));
      };

      // Nothing in the collection? It's not done fetching. Let's wait for it.
      if (NS.app.visionCollection.size() === 0) {
        // Render when the collection resets
        NS.app.visionCollection.once('reset', function() {
          render();
        });
      } else {
        render();
      }
    },
    new: function(category) {
        NS.app.mainRegion.show(new NS.VisionFormView({
          category: category,
          collection: NS.app.visionCollection,
          model: new Backbone.Model({
            category: category,
            author: NS.app.currentUser.get('id')
          })
        }));
    },
    item: function(id) {
      id = parseInt(id, 10);
      var render = function() {
            var model = NS.app.visionCollection.get(id);
            NS.app.mainRegion.show(new NS.VisionDetailView({
              model: model,
              collection: model.get('replies')
            }));
          };

      // Nothing in the collection? It's not done fetching. Let's wait for it.
      if (NS.app.visionCollection.size() === 0) {
        // Render when the collection resets
        NS.app.visionCollection.once('reset', function() {
          render();
        });
      } else {
        render();
      }
    },
    home: function() {
      NS.app.mainRegion.show(NS.app.homeView);
      // Init this here b/c we know we're inserted into the dom at this point.
      // Important for height calculations.
      NS.app.homeView.swiper = new Swiper(NS.app.homeView.$('.swiper-container').get(0), {
        loop: true,
        calculateHeight: true
      });
    }
  };

  // App ======================================================================
  NS.app = new Backbone.Marionette.Application();

  NS.app.addRegions({
    mainRegion: '.main'
  });

  NS.app.addInitializer(function(options){
    this.homeView = new NS.HomeView({
      collection: this.visionCollection
    });
  });

  NS.app.addInitializer(function(options){
    // Construct a new app router
    this.router = new NS.Router({
      controller: NS.controller
    });

    Backbone.history.start({ pushState: Modernizr.history, silent: true });
    if(!Modernizr.history) {
        var rootLength = Backbone.history.options.root.length,
            fragment = window.location.pathname.substr(rootLength),
            url;

        if (fragment) {
          Backbone.history.navigate(fragment, { trigger: true });
          url = window.location.protocol + '//' + window.location.host +
              Backbone.history.options.root + '#' + fragment;

          // Do a full redirect so we don't get urls like /visions/7#visions/7
          window.location = url;
        } else {
          Backbone.history.loadUrl(Backbone.history.getFragment());
        }
    } else {
        Backbone.history.loadUrl(Backbone.history.getFragment());
    }

    // Globally capture clicks. If they are internal and not in the pass
    // through list, route them through Backbone's navigate method.
    $(document).on("click", "a[href^='/']", function(evt) {
      var href = $(evt.currentTarget).attr('href'),
          url;

      // Allow shift+click for new tabs, etc.
      if (!evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
        evt.preventDefault();

        // Remove leading slashes and hash bangs (backward compatablility)
        url = href; //.replace(/^\//, '').replace('#!/', '');

        // # Instruct Backbone to trigger routing events
        NS.app.router.navigate(url, { trigger: true });

        return false;
      }

    });
  });

  // Init =====================================================================
  $(function() {
    NS.app.visionCollection = new NS.VisionCollection();
    NS.app.visionCollection.fetch({
      reset: true
    });

    // TODO: This user should be bootstrapped by the server
    NS.app.currentUser = new Backbone.Model(NS.currentUserData || {},
                                            {url: '/api/users/current/'});
    NS.app.currentUser.fetch();

    NS.app.start({
      visionCollection: NS.app.visionCollection
    });
  });

}(VisionLouisville));