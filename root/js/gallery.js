var WidgetGallery = Ember.Application.create();

WidgetGallery.Router.map(function () {});

WidgetGallery.IndexRoute = Ember.Route.extend({
    model: function () {
        return [
            'Genome Browser',
            'Manhattan Plot',
            'Expression Profile',
            'Tree Browser',
            'Coexpression Network',
            'Gene Report'
        ];
    }
});