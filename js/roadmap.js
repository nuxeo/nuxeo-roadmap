'use strict';

(function() {
	/* 
	 * lookup method used to retrieve and cache jquery selections.
	 * !!! Build for being used only for statics elements (element lookup that will never change) !!!
	 */
	var lookup = function() {
		var _cache = {};
		return function (selector) {
			return _cache[selector] || (_cache[selector] = $(selector));
		};
	}();


	// Issues (all) cache
	var CACHE 		= [];
	// Event constants
	var NXEVENT = {
		VERSION_CLICK 				: 'version.click',
		VERSIONS_LOADED				: 'versions.loaded',
		COMPONENTS_LOADED 			: 'components.loaded',
		FILTER_BY_SELECTION			: 'filter.selection'
	};


	// Roadmap module
	angular.module('nxroadmap', [])

	// jira service
	.factory('jira', [function() {
		return {
			getVersions: function(callback) {
				return $.jira('versions', {
					'project': 'NXROADMAP',
					'url': 'https://jira.nuxeo.com'
				}).done(callback);
			},
			getComponents: function(callback) {
				return $.jira('components', {
					'project': 'NXROADMAP',
					'url': 'https://jira.nuxeo.com'
				}).done(callback);
			},
			getIssues: function(versions, callback) {
				return $.jira('issues', {
					'project'	: 'NXROADMAP',
					'url'		: 'https://jira.nuxeo.com',
					'version'	: versions
				}).done(callback);
			}
		};
	}])

	.factory('roadmap', [function() {
		return {
			// Return an LTS id if no ft is selected else return the selected ft id
			getVersionSelection: function() {
				var selection = {
					lts: true
				};

				var ftId = $('#versions .panel .active').attr('data-version');
				if(ftId) {
					selection.lts = false;
					selection.id = ftId;
				}
				else {
					selection.id = $('#versions .panel .in').parent('.panel').attr('data-version');
				}

				return selection;
			},
			getComponentsSelection: function() {
				return lookup('#components').chosen().val();
//				return $('#components').chosen().val();
			},
			// Get global selection object
			getSelection: function() {
				return {
					version 	: this.getVersionSelection(),
					components 	: this.getComponentsSelection()
				}
			}
		};
	}])

	.filter('priority', function() {
		return function(issues) {
			if(! issues) {
				return issues;
			}

			issues.sort(function(x, y) {
				// Sort by prority id
				var sort =  x.fields.priority.id - y.fields.priority.id;
				// If equals sort by creation order (id)
				if(sort == 0) {
					return - (x.id - y.id);
				}

				return sort;
			});

			return issues;
		}
	})

	// Reduce an issues array based on the passed selection object
	.filter('reduce', function() {
		return function(issues, versions, selection) {
			// Components to filter
			var components 	= selection.components || [];
			// Versions to filter
			var versionsIds = [];
			if(selection.version) {
				var versionsIds = selection.version.lts ? versions.versionsIds[selection.version.id] : [selection.version.id];
			}

			var filtereds = [];
			for(var i in issues) {
				var issue 			= issues[i];
				var fixVersionsIds 	= [];
				var issueComponents = [];
				var checkVersion 	= ! selection.version;
				var checkCmps 	 	= ! selection.components;

				if(! checkVersion) {
					if(issue.fields.fixVersions) {
						for(var i in issue.fields.fixVersions) {
							fixVersionsIds.push(issue.fields.fixVersions[i].id);
						}

						for(var k in versionsIds) {
							var versionId = versionsIds[k];
							if($.inArray(versionId, fixVersionsIds) !== -1) {
								checkVersion = true;
								break;
							}
						}
					}
				}

				if(! checkCmps) {
					for(var j in issue.fields.components) {
						issueComponents.push(issue.fields.components[j].id);
					}
					
					if(issueComponents) {
						for(var l in components) {
							var cmpId = components[l];
							if($.inArray(cmpId, issueComponents) !== -1) {
								checkCmps = true;
								break;
							}
						}
					}
				}

				if(checkVersion === true && checkCmps === true) {
					filtereds.push(issue);
				}
			}

			return filtereds;
		};
	})

	// Base controller
	.controller('root', function($scope, $sce, roadmap) {
		$scope.filterIssuesByVersion = function(versionId) {
			$scope.$broadcast(NXEVENT.VERSION_CLICK, versionId);
			$scope.$broadcast(NXEVENT.FILTER_BY_SELECTION);
		};

		$scope.fireVersionsLoaded = function(versions) {
			$scope.$broadcast(NXEVENT.VERSIONS_LOADED, versions);
		};

		$scope.fireComponentsLoaded = function(components) {
			$scope.$broadcast(NXEVENT.COMPONENTS_LOADED, components);
		};

		$scope.filterIssuesByComponents = function() {
			$scope.$broadcast(NXEVENT.FILTER_BY_SELECTION);
		};

		$scope.filterIssuesByLts = function(ltsId, clear) {
			// If clear is set to true then unselect the current active ft version
			if(clear === true) {
				$('#versions .active').removeClass('active');

				// If we're here we're sure that the method call is triggered by the user click.
				// At this point we have to check if the selected lts isn't already displayed.
				if(ltsId === roadmap.getVersionSelection().id) {
					console.debug('LTS ' + ltsId + ' already displayed');
					return;
				}
			}

			// Force to use a version selection in order to avoid weird behavior when a LTS is selected
			$scope.$broadcast(NXEVENT.FILTER_BY_SELECTION, {
				lts: true,
				id : ltsId
			});
		};

		$scope.trusted = function(input) {
			return $sce.trustAsHtml(input);
		};
	})

	// specific controllers

	.controller('versions', function($scope, $timeout, jira) {
		// Load jira roadmap project versions
		jira.getVersions(function(data, status) {
			$scope.$apply(function() {
				$scope.versions = $.jira('createVersions', data);
				$scope.fireVersionsLoaded($scope.versions);
			});
		});
	})

	.controller('components', function($scope, $timeout, jira) {
		// Load jira roadmap project versions
		jira.getComponents(function(data, status) {
			$scope.$apply(function() {
				$scope.components = data;
				$scope.fireComponentsLoaded(data);

				// Defer components change binding
				$timeout(function() {
					//$('#components').chosen({
					lookup('#components').chosen({
						placeholder_text_multiple: 'Select component(s) for issues filtering'
					}).change(function() {
						$scope.filterIssuesByComponents();
					});
				});
			});
		});
	})

	.controller('issues', function($scope, $filter, $timeout, roadmap, jira) {
		$scope.$on(NXEVENT.VERSION_CLICK, function(event, versionId) {
			// Remove the class active on the previously selected ft
			$('a[data-version]').removeClass('active');
			// Apply the active class on the selected ft
			$('a[data-version=' + versionId + ']').addClass('active');
		});

		$scope.$on(NXEVENT.VERSIONS_LOADED, function(event, versions) {
			$scope.versions = versions;
			jira.getIssues(versions.ids, function(data, status) {
				$scope.$apply(function() {
					// Filter issues by priority, cache them and bind the result on the scope
					$scope.issues = CACHE = $filter('priority')(data.issues);
					var ltsId = $('.panel-info div[role=tabpanel]')
									.addClass('in')
									.parent('.panel')
									.attr('data-version');
					$scope.filterIssuesByLts(ltsId);
				});
			});
		});

		$scope.$on(NXEVENT.FILTER_BY_SELECTION, function(event, versionSelection) {
			var selection = null;

			if(versionSelection) {
				// Force to use the passed selection
				selection = {
					components 	: roadmap.getComponentsSelection(),
					version 	: versionSelection
				}
			}
			else {
				// Fetch the current selection
				selection = roadmap.getSelection();
			}

			$timeout(function() {
				// Reduce the displayed issues based on the computed selection
				$scope.issues = $filter('reduce')(CACHE, $scope.versions, selection);
			});
		});
	})

	;
})();