/*
 * 
 * /admin/containers/list?status=(active,ready,error,stale)
 * /admin/containers/<containerid>
 * /admin/containers/kill/<containerid>
 * /admin/containers/rm/<containerid>
 * /admin/containers/new
 * /admin/users/list
 * /admin/users/<userid>
 * /admin/users
 * 
 */

var Nunjucks = require('nunjucks');

module.exports.Admin = Object.create({}, {
    init: {
        value: function (cfg) {
            this.App = cfg.app;
            
            this.templates = {};
            var loaders = [
                new Nunjucks.FileSystemLoader('templates')
            ];
            this.templates.env = new Nunjucks.Environment(loaders, {
                'autoescape': false
            });
            
            return this;
        }
    },
    renderTemplate: {
        value: function (name, context) {
            var template = this.getTemplate(name);
            if (!template) {
                throw 'Template ' + name + ' not found';
            }
            var context = context ? context : this.createTemplateContext();
            return template.render(context);
        }
    },
    route: {
        value: function (req, res, url, path) {
            var handled = false;
            if (path.match(/containers/)) {
                // list all
                this.App.getContainers(function (containers) {
                    res.setHeader('Content-Type', 'application/json');
                    var context = {containers: containers};
                    //var template = this.templates.env.getTemplate('containers.html');
                    //var content = template.render(context);
                    //res.write(content);
                    res.write(JSON.stringify(containers));
                    res.end();
                    return;
                });
                handled = true;
            } else if (path.match(/\/containers\/active/)) {
                // list just active
            } else if (path.match(/\/containers\/ready/)) {
                // list just active
            } else if (path.match(/\/containers\/error/)) {
                // list just active
            } else if (path.match(/\/containers\/stale/)) {
                // list just active
            }
            if (!handled) {
                console.log(path);
                res.setHeader('Content-Type', 'application/json');
                res.write(JSON.stringify({error: 'not-implemented'}));
                res.end();
                return;
            }
        }
    }
});