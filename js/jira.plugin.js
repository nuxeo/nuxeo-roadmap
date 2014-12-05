 'use strict';

(function($) {

	// Start Search

	var Search = function(url) {
		if(! url) {
			throw new Error('The passed url isn\'t (' + url + ') valid');
		}

		this.baseURL 		= url;
		this.searchURL 		= url + '/rest/api/latest/search';
		this.conditions 	= [];
		this.letterRegex 	= /[A-Z]/i;
	};
	Search.prototype.project = function(projectName) {
		this.conditions = [];
		this.conditions.push('project=' + projectName);

		return this;
	};
	Search.prototype.orderBy = function(properties, sens) {
		if(! $.isArray(properties)) {
			properties = [properties];
		}

		this.condition(null, 'ORDER+BY', '+' + properties.join(','), '+' + sens.toUpperCase());
		return this;
	};
	Search.prototype.condition = function(property, operator, value, suffix) {
		this.conditions.push(
			(property || '') +
			this.formatOperator(operator, property) +
			this.formatValue(operator, value) +
			(suffix || '')
		);
		return this;
	};
	Search.prototype.is = function(property, value) {
		return this.condition(property, 'IS', value);
	};
	Search.prototype.isNot = function(property, value) {
		return this.condition(property, 'IS+NOT', value);
	};
	Search.prototype.isIn = function(property, value) {
		return this.condition(property, 'IN', value);
	};
	Search.prototype.notIn = function(property, value) {
		return this.condition(property, 'NOT+IN', value);
	};
	Search.prototype.wasNot = function(property, value) {
		return this.condition(property, 'WAS+NOT', value);
	};
	Search.prototype.wasIn = function(property, value) {
		return this.condition(property, 'WAS+IN', value);
	};
	Search.prototype.wasNotIn = function(property, value) {
		return this.condition(property, 'WAS+NOT+IN', value);
	};
	Search.prototype.gt = function(property, value) {
		return this.condition(property, '>', value);
	};
	Search.prototype.lt = function(property, value) {
		return this.condition(property, '<', value);
	};
	Search.prototype.lte = function(property, value) {
		return this.condition(property, '<=', value);
	};
	Search.prototype.gte = function(property, value) {
		return this.condition(property, '>=', value);
	};
	Search.prototype.eq = function(property, value) {
		return this.condition(property, '=', value);
	};
	Search.prototype.neq = function(property, value) {
		return this.condition(property, '!=', value);
	};
	Search.prototype.and = function() {
		this.conditions.push('AND');
		return this;
	};
	Search.prototype.or = function() {
		this.conditions.push('OR');
		return this;
	};
	Search.prototype.toURL = function() {
		var url = this.searchURL + '?jql=';
		url += this.conditions.join('+');

		return url;
	};
	Search.prototype.startWithLetter = function(operator) {
		return operator.charAt(0).match(this.letterRegex);
	};
	Search.prototype.formatOperator = function(operator, property) {
		if(this.startWithLetter(operator) && property) {
			return '+' + operator;
		}

		return operator;
	};
	Search.prototype.formatValue = function(operator, value) {
		if(this.startWithLetter(operator) && $.isArray(value)) {
			return '+(' + value.join(',') + ')';
		}

		return value;
	};
	// End Search


	// Start Versions
	var Versions = function(data) {
        if(! $.isArray(data)) {
            throw new Error('The data parameter must be an array');
        }

        self = this;
        self.activeVersionId = null;

        // Filter versions
        data = $.grep(data, function(version, i) {
        	version.jsDate = new Date(version.releaseDate);
			version.is_lts = version.name.indexOf('LTS') === 0;

            var currentDate  = new Date();
            var startingDate = new Date(version.jsDate.getFullYear(), version.jsDate.getMonth() - 2, version.jsDate.getDay() + 1);

            if(version.released && version.is_lts) {
                version.panel = 'success';
            }
            else {
                version.panel = 'warning';
                if(startingDate <= currentDate && currentDate <= version.jsDate) {
                    version.current = true;
                    self.activeVersionId = version.id;
                }
            }

        	return self.isDisplayableVersion(version);
        });

        // Initial versions
        this.data        = data;
        // Ids of versions (flat version of versionsIds)
        this.ids 		 = [];
        // All lts
        this.lts         = [];
        // LTS map where the key is an LTS id and the values an array of FT
        this.versions    = {};
        // Same as versions but just with the ids
        this.versionsIds = {};
        // Eagerly load the versions
        this.load();
    };
    // Load the lts array and the _versions object
    Versions.prototype.load = function() {
        // Sort versions based on the releaseDate field
        this.data.sort(function(x, y) {
            return x.jsDate - y.jsDate;
        });

        var self = this;
        $.each(this.data, function(idx, version) {
        	// Cache ids
        	self.ids.push(version.id);

            if(version.is_lts) {
                self.lts.push(version);

                var versions = [];
                var versionsIds = [];

                // Process versions before this lts and collect them until another lts was found
                for (var i = idx - 1; i >= 0; i--) {
                    var subVersion = self.data[i];
                    if(subVersion.is_lts) {
                        break;
                    }

                    // Collect the version
                    versions.push(subVersion);
                    versionsIds.push(subVersion.id);
                };

                // to inverse: versions.reverse()
                self.versions[version.id] = versions;
                self.versionsIds[version.id] = versionsIds;

                // Check active version id lts - and if found set the lts panel type to info because it contains the active FT
                if($.inArray(self.activeVersionId, versionsIds) !== -1) {
                    version.panel = 'info';
                }
            }
        });

        // Remove the initial versions array
        delete this.data;
    };
    Versions.prototype.isDisplayableVersion = function(version) {
            return ! version.archived && (version.name.indexOf("LTS") === 0 || version.name.indexOf("FT")  === 0);
	};
    // Get FT of the passed LTS
    Versions.prototype.getVersions = function(lts_id) {
        var fts = this.versions[lts_id];
        if(! fts) {
            console.log('FTs for LTS ' + id + ' doesn\'t exists');
        }

        return fts;
    };

    // End Versions


	// Make it public for debugging
	//window.Search = Search;


	var functions = {
		exposed: {
			versions: function(options) {
				var url = options.url + '/rest/api/latest/project/' + options.project + '/versions';
				return $.when($.get(url));
			},
			issues: function(options) {
				var versions = options.version;
				if(! $.isArray(versions)) {
					versions = [options.version];
				}

				var url = new Search(options.url)
							.project(options.project)
							.and()
							.isIn('fixversion', versions)
							.toURL();

				return $.when($.get(url));
			},
			components: function(options) {
				var url = options.url + '/rest/api/latest/project/' + options.project + '/components';
				return $.when($.get(url));
			},
			createVersions: function(rawVersions) {
				return new Versions(rawVersions);
			},
			search: function(baseURL) {
				return new Search(baseURL);
			}
		}
	};

	$.jira = function(action, options)  {
		var func = functions.exposed[action];
		if(typeof func !== 'function') {
			throw new Error('Action ' + action + ' doesn\'t exist');
		}

		return func.apply(this, [options]);
	};

})(jQuery);