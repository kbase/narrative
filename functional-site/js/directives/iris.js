
/*
 *  Directives (widgets) that are used for an Iris view.
 *
 *
 *
 *
 *
 */


angular.module('iris-directives', []);
angular.module('iris-directives')
    .directive('processlist', function($rootScope) {
        return {
            link: function(scope, element, attrs, routeParams) {
                //$loginbox = $('#login').kbaseLogin();                

                $rootScope.plist = $(element).kbaseIrisProcessList();

                $rootScope.term = $.jqElem('div').kbaseIrisTerminal({
                    'promptIfUnauthenticated'   : 0,
                    'invocationURL'             : 'http://kbase.us/services/invocation',
                    'commandsElement'           : $rootScope.commandlist,
                    'grammar'                   : $('<div></div>').kbaseIrisGrammar(),
                    autocreateFileBrowser       : false,
                });
            }
        }
    }).directive('tabs', function($rootScope) {
        return {
            link: function(scope, element, attrs, routeParams) {
                var $tabs = $(element).kbaseTabs(
                    {
                        tabPosition : 'bottom', //or left or right or top. Defaults to 'top'
                        canDelete : true,
                        tabs : [
                            {
                                tab : 'IRIS Terminal',
                                content : $rootScope.term.$elem,
                                canDelete : false
                            },
                        ],
                        tabsHeight : (parseInt($rootScope.term.terminalHeight()) + 100) + 'px',
                    }
                );
            }
        }
    }).directive('commandlist', function($rootScope) {
        return {
            link: function(scope, element, attrs, routeParams) {
                $rootScope.commandlist = $(element);
                $(element).kbaseIrisCommands(
                    {
                        client          : $rootScope.term.client(),
                        terminal        : $rootScope.term,
                        englishCommands : false,
                        overflow        : true,
                        link            : function (evt) {
                            evt.preventDefault();
                            var append = $(this).attr('title') + ' ';
                            if ($rootScope.term.input_box.val().length && ! $rootScope.term.input_box.val().match(/[\|;]\s*$/)) {
                                append = '| ' + append;
                            }
                            $rootScope.term.appendInput(append);
                        },
                    }
                );
            }
        }
    }).directive('filebrowser', function($rootScope) {
        return {
           link: function(scope, element, attrs, routeParams) {
                var $fb = $(element).kbaseIrisFileBrowser (
                    {
                        client : $rootScope.term.client(),
                        invocationURL   : $rootScope.term.options.invocationURL,
                        addFileCallback : function (file, $fb) {
                            $rootScope.term.appendInput(file + ' ');
                        },
                        editFileCallback : function (file, $fb) {

                            var $editor = $.jqElem('div').kbaseIrisFileEditor(
                                {
                                    file : file,
                                    client : $fb.client(),
                                    saveFileCallback : function(file) {
                                        $tabs.removeTab(file)
                                    },
                                    cancelSaveFileCallback : function(file) {
                                        $tabs.removeTab(file)
                                    },
                                }
                            )

                            if ($tabs.hasTab(file)) {
                                $tabs.showTab(file);
                            }
                            else {
                                $tabs.addTab(
                                    {
                                        tab : file,
                                        content : $editor.$elem,
                                        canDelete : true,
                                        show : true,
                                        deleteCallback : function(tab) {
                                            $editor.savePrompt();
                                        }
                                    }
                                );
                            }
                        },
                    }
                );

                $rootScope.term.addFileBrowser($fb);
                $rootScope.term.data('processList', $rootScope.plist);

                var command = getParameterByName('command');
                if (command.length) {
                    var login = getParameterByName('signin-button');
                    if (login.length) {
                        $rootScope.term.run('login ' + login);
                    }
                    setTimeout(
                        function() {
                            $rootScope.term.out_cmd(command);
                           $rootScope.term.run(command);
                        },
                        200
                    );
                }

           }
       }
   });

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}