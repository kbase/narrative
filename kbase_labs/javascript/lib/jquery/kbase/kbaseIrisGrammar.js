/*


*/
(function( $, undefined ) {


    $.kbWidget("kbaseIrisGrammar", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            defaultGrammarURL : 'http://www.prototypesite.net/iris-dev/grammar.json',
        },

        init: function(options) {

            this._super(options);

            if (this.options.$loginbox != undefined) {
                this.$loginbox = this.options.$loginbox;
            }

            this.appendUI( $( this.$elem ) );

            this.retrieveGrammar(this.options.defaultGrammarURL);

            return this;

        },

        appendUI : function($elem) {

        },

        tokenize : function(string) {

            var tokens = [];
            var partial = '';
            var quote = undefined;
            var escaped = false;

            for (var idx = 0; idx < string.length; idx++) {
                var chr = string.charAt(idx);
                if (quote == undefined) {
                    //semi colons and question marks will be delimiters...eventually. Just skip 'em for now.
                    if (chr.match(/[?;]/)) {
                        continue;
                    }
                }

                if (chr.match(/\S/) || quote != undefined) {
                    partial = partial + chr;
                }
                else {
                    if (partial.length) {
                        tokens.push(partial);
                        partial = '';
                    }
                    continue;
                }

                if (quote != undefined) {

                    if (chr == quote && ! escaped) {
                        partial = partial.substring(1, partial.length - 1);
                        tokens.push(partial);
                        partial = '';
                        quote = undefined;
                        continue;
                    }

                }

                if (quote == undefined) {
                    if (chr == '"' || chr == "'") {
                        quote = chr;
                    }
                }

                if (chr == '\\') {
                    escaped = true;
                }
                else {
                    escaped = false;
                }

            }

            if (partial.length) {
                tokens.push(partial)
            }

            return tokens;
        },


        evaluate : function (string, callback) {
//++        console.log("evaluating " + string);
            var tokens  = this.tokenize(string);
            var grammar = this.grammar;

            if (grammar == undefined) {
                this.retrieveGrammar(this.options.defaultGrammarURL, $.proxy(function() {this.evaluate(string, callback); }, this));
                return;
            }

            //grammar = grammar._root;

            var execute = undefined;
            var tokenVariables = undefined;

            var variables = {};

            var returnObj = {
                parsed : '',
                string : string,
                grammar : grammar._root,
            };

            if (tokens[0] == 'explain') {
                tokens.shift();
                returnObj.explain = 1;
            }

//++                console.log("GRAMMAR");console.log(returnObj.grammar);
//++console.log("evaluating " + tokens);
            for (var idx = 0; idx < tokens.length; idx++) {

                var token = tokens[idx];
                var childFound = false;
//--console.log('checking token ' + token);
//--console.log("AGAINST");//--console.log(returnObj.grammar);
                for (child in returnObj.grammar.children) {
                //--console.log("CHILD IS " + child + ' against ' + token);
                //--console.log(returnObj.grammar.children);
                if (child.match(/^\$/)) {
                    //--console.log("VARIABLE ATTEMPT!");
                }
                    var info = returnObj.grammar.children[child];

                    if (info.regex && token.match(info.regex)) {
                        //--console.log('regex match');
                        returnObj.grammar = returnObj.grammar.children[child];
                        childFound = true
                    }
                    else if (child.match(/^\$/)) {
                    //--console.log("VARIABLE MATCH ON " + child + " which is " + token);
                        returnObj.grammar = returnObj.grammar.children[child];
                        childFound = true;
                    }

                    else if (token == child) {
                        returnObj.grammar = returnObj.grammar.children[child];
                        childFound = true;
                    }
                    else if (! info.caseSensitive) {
                        var regex = new RegExp('^' + child + '$', 'i');
                        if (token.match(regex)) {
                        //--console.log("INSENSITIVE MATCH on " + token + ', ' + child);
                        //--console.log(returnObj.grammar);
                            returnObj.grammar = returnObj.grammar.children[child];
                        //--console.log(returnObj.grammar);
                            childFound = true;
                        }
                    }

                    if (childFound) {
                        if (child.match(/^\$/)) {
                            variables[child] = token;
                        }
                        //else {
                            if (returnObj.parsed.length) {
                                returnObj.parsed = returnObj.parsed + ' ' + token;
                            }
                            else {
                                returnObj.parsed = token;
                            }
                        //}
                        //--console.log("LOOPING BACK IN WITH");
                        //--console.log(returnObj.grammar);
                        //--console.log(info.children);
                        returnObj.grammar = info;
                        returnObj.execute = info.execute;
                        break;
                    }

                }
                if (! childFound && ! returnObj.grammar.childrenOptional) {
                console.log("COULD NOT FIND CHILD = " + token);
                    returnObj.tail = tokens.splice(idx, tokens.length - idx).join(' ');
                    console.log(returnObj.tail);
                    break;
                }
            }
//--console.log("CHILDREN");//--console.log(returnObj.grammar.children);
////--console.log("T1 - " + Object.keys(returnObj.grammar.children).length + ', T2 - ' + ! returnObj.grammar.childrenOptional);
            if (returnObj.grammar.children != undefined && Object.keys(returnObj.grammar.children).length && ! returnObj.grammar.childrenOptional) {
                returnObj.error = "Parse error at " + token;
                returnObj.fail = 1;
                delete returnObj.execute;
                returnObj.token = token;
                returnObj.tail = tokens.splice(idx, tokens.length - idx).join(' ');
                var next = [];
                if (returnObj.grammar.children != undefined) {
                    for (prop in returnObj.grammar.children) {
                        //next.push(prop);
                        next.push(this.nextForGrammar(prop, returnObj.grammar.children));
                    }
                }
                returnObj.next = next.sort();

                if (callback) {
                    callback(returnObj);
                }
                return returnObj;

            }


            returnObj.rawExecute = returnObj.execute;
            for (var variable in variables) {
            //--console.log("(" + variable + ")" + '(' + variables[variable] + ')');
                returnObj.execute = returnObj.execute.replace(variable, variables[variable]);
            }

            //--console.log("will execute : " + returnObj.execute);
            //--console.log(variables);

            if (returnObj.tail) {
                var m;
                if (m = returnObj.tail.match(/^into\s+(\S+)/)) {
                    returnObj.execute = returnObj.execute + ' > ' + m[1];
                }
                else {
                    returnObj.fail = 1;
                    returnObj.error = 'Extra characters - ' + returnObj.tail;
                }
            }

            if (callback) {
                callback(returnObj);
            };

            return returnObj;

        },

        nextForGrammar : function(next, grammar) {
//console.log("NEXT 4 - " + next);
            if (next == undefined) {
                next = '';
            }

            var nextGrammar = grammar[next].children;
            var ng;
            var throttle = 1000;
//console.log(nextGrammar);
//console.log(Object.keys(nextGrammar).length);

            while (nextGrammar != undefined && throttle-- > 0) {
                if (Object.keys(nextGrammar).length == 1) {
                    var prop = Object.keys(nextGrammar)[0];
                    //console.log("FOUND PROP");console.log(prop);
                    next = next.length
                        ? next + ' ' + prop
                        : prop;
                    //console.log("FOUND " + next + ', ' + prop);
                    nextGrammar = nextGrammar[prop].children;
                    //console.log("NG NOW");console.log(nextGrammar);
                }
            }
//console.log("NEXT return - " + next);
            return next;
        },


        allQuestions : function(filter) {
            var questions =  [
                "Display the dna sequence of contig $contig_id from $max to $min",
                "Display the dna sequence of gene $gene_id",
                "What type of family is $family",
                "What is the function of family $family",
                "What fids are in family $family",
                "Display sequences in family $family as fasta",
                "Display sequences in family $family",
                "What is the function of feature $feature_id",
                "What fids in k12 have attached publications",
                "What publications have been connected to gene thrB",
                "Show the DNA sequence of fid thrB",
                "Display the protein sequence of fid thrB",
                "Which protein families contain gene $gene_id",
                "Is fid thrB in an atomic regulon",
                "Which fids appear to have correlated expression with gene thrB",
                "What is the location of feature thrB",
                "What protein sequence corresponds to fid $fid",
                "Which contigs are in genome $genome",
                "What is the size of genome $genome",
                "What is the KBase id of SEED genome $genome",
                "What is the KBase id of SEED feature $feature",
                "What is the source of genome $genome",
                "Which are the closest genomes to $genome",
                "What is the name of genome $genome",
                "Which genomes have models",
                "Which models exist for genome $genome",
                "Which reactions exist in genome $genome",
                "Which reactions are in model $model",
                "What reactions connect to role $role",
                "What roles relate to reaction $reaction",
                "What complexes implement reaction $reaction",
                "What reactions does complex $complex implement",
                "Describe the biomass reaction for model kb|fm.0",
                "What compounds are connected to model $model",
                "What media are known",
                "What compounds are considered part of media $media",
                "show reactions that connect to compound $compound",
                "How many otus exist",
                "What otus exist",
                "What otu contains $otu",
                "What genomes are in OTU $otu",
                "What annotations are known for protein sequence $sequence",
                "What roles are used in models",
                "What roles are used in subsystem $subsystem",
                "What subsystems include role $role",
                "What features in $feature implement role $role",
                "What families implement role $role",
                "What roles occur in subsystem $subsystem",
                "What roles are in subsystem $subsystem",
                "What genomes are in subsystem $subsystem",
                "What subsystems are in genome $genome",
                "what is the taxonomy of genome $genome",
                "What is the taxonomic group id of $group_id",
                "What genomes are in taxonomic group $group",
            ];

            if (filter == undefined) {
                return questions;
            }
            else {
                var filteredQ = [];
                var qRegex = new RegExp(filter);
                for (var idx = 0; idx < questions.length; idx++) {
                    var q = questions[idx];
                    console.log(q + ' match ' + qRegex);
                    if (q.match(qRegex)) {
                        filteredQ.push(q);
                    }
                }
                return filteredQ;
            }
        },

        XXXallQuestionsBOGUS : function(grammar, prefix) {
            if (prefix == undefined) {
                prefix = '';
            }
            console.log("CALL AQ");
            console.log(this.grammar);
            if (grammar == undefined) {
                if (this.grammar == undefined) {
                    this.retrieveGrammar(this.options.defaultGrammarURL, $.proxy(function() {this.allQuestions(); }, this));
                    return;
                }
                else {
                    grammar = this.grammar._root.children;
                }
            }
            console.log("checks it now!");
            console.log(grammar);
            for (var child in grammar) {
                //console.log(child);

                var childPrefix = prefix.length
                    ? prefix + ' ' + child
                    : child;

                console.log(childPrefix);
                //var questions = this.allQuestions(grammar[child].children, childPrefix);
            }
        },

        retrieveGrammar : function(url, callback) {

            var token = undefined;
            //this.$loginbox.token();
            ////--console.log(token);
//--console.log(url);
            $.ajax(
                {
    		        async : true,
            		dataType: "text",
            		url: url,
            		crossDomain : true,
            		beforeSend: function (xhr) {
		                if (token) {
                			xhr.setRequestHeader('Authorization', token);
		                }
            		},
            		success: $.proxy(function (data, status, xhr) {

            		    var json = JSON.parse(data);

            		    /*for (id in json) {
            		        var newChildren = {};
            		        for (var idx = 0; idx < json[id].children.length; idx++) {
            		            var childId = json[id].children[idx];
            		            newChildren[childId] = json[childId];
            		        }
            		        ////--console.log("NC");//--console.log(newChildren);
            		        json[id].children = newChildren;
            		    }

            		    //--console.log(json);*/
            		    this.grammar = json;

            		    if (callback) {
            		        callback();
            		    }

		            }, this),
            		error: $.proxy(function(xhr, textStatus, errorThrown) {
            		    this.dbg(textStatus);
                        throw xhr;
		            }, this),
                    type: 'GET',
    	        }
    	    );

        }


    });

}( jQuery ) );
