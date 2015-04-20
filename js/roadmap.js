'use strict';

(function() {
	/**
	 * Handle browser hash in order to trigger some piece of codes based on the ROUTES constant
	 */
	if("onhashchange" in window) {
		console.log('History is supported by this browser');
		$(window).on('hashchange', function() {
			var hash = window.location.hash;
			if(hash.indexOf('#/') == 0) {
				hash = hash.substr(2);
			}

			$.each(ROUTES, function(index, route) {
				var matches = route.pattern.exec(hash);
				if(matches) {
					var handler = route.scopedHandler || route.handler;
					if(route.binder) {
						handler(route.binder(matches));
					}
					else {
						handler(matches);
					}
				}
			});
		});
	}

	var ROUTES = [{
		'pattern': /^issues\/(.*)/,
		'binder' : function(matches) {
			return matches[1];
		},
		'handler': displayItem
	}];

	function displayItem(itemId) {
		var founded = null;
		$.each(CACHE, function(idx, issue) {
			// Match on id or key
			if(issue.id == itemId || issue.key == itemId) {
				founded = issue;
				return false;
			}
		});

		if(founded) {
			displayIssue.apply(this, [founded]);
		}
		else {
			console.debug('Unable to find the issue ' + itemId);
		}
	}

	function displayIssue(issue) {
		// Get the fixVersion and the assoociated LTS
		var fixVersions = issue.fields.fixVersions;
		var ltsId = -1;
		try {
			ltsId = VERSIONS.getLTS(fixVersions[0].id);
		}
		catch(e) {
			console.debug(e);
		}
		finally {
			if(ltsId == -1) {
				console.log('Unable to trigger LTS click for the permalink');
				return;
			}
		}

		var scope = this;
		// Cache the permlinked issue in the scope
		this.permlinked = issue.id;
		// Trigger issues filtering / LTS
		this.filterIssuesByLts(ltsId, true, function(same) {
			scope.fireHightlightPermlinked();
		});
	}

	function hightlightPermlinked() {
		var sel = $('.permlinked');
		if(sel.size() > 0) {
			$.colorbox({
				inline: true,
				width: '50%',
				href: sel
			});	
		}
	}

	/* 
	 * lookup method used to retrieve and cache jquery selections.
	 * !!! Build for being used only for statics elements (element lookup that will never change) !!!
	 */
	var lookup = function() {
		var _cache = {};
		return function (selector, rm) {
			var elm = _cache[selector] || (_cache[selector] = $(selector));
 			if(rm === true) {
 				delete _cache[selector];
 			}

			return elm;
		};
	}();

	var CONTENT_TYPES = {
		'png' : 'image/png',
		'jpg' : 'image/jpeg',
		'jpeg': 'image/jpeg',
		'gif' : 'image/gif',
		'svg' : 'image/svg+xml',
		'pdf' : 'application/pdf',
		'xml' : 'application/xml',
		'json': 'application/json',
		'zip' : 'application/zip'
	};

	var HOST = location.protocol + '//' + location.hostname + (location.port ? (':' + location.port) : '');

	// Get the content from a filename by extracting the extension
	function contentTypeOf(ext) {
		return CONTENT_TYPES[ext];
	}

	function extensionOf(filename) {
		var idx = filename.lastIndexOf('.');
		if(idx <= 0) {
			return false;
		}

		return filename.substr(idx + 1);
	}

	var ISSUE_LOADER_SELECTOR = '#issues-loader';
	var JIRA_BASE_URL         = 'https://jira.nuxeo.com';
	var JIRA_PROJECT 		  = 'NXROADMAP';
	/*
	 * File that are conserved for rendering (preview in the issue footer).
	 * 
	 * Files that are not images should also be added in CONTENT_TYPES_THUMBS object
	 * with their associated thumb. In addition to this, you must also check if the file extension is in CONTENT_TYPES.
	 */
	var ATTACHMENTS_FILTER	  = /\.(png|jpeg|jpg|gif|pdf)$/i;

	// Issues (all) cache
	var CACHE 		= [];
	var VERSIONS    = null;

	// Event constants
	var NXEVENT = {
		VERSION_CLICK 		  : 'version.click',
		VERSIONS_LOADED		  : 'versions.loaded',
		COMPONENTS_LOADED 	  : 'components.loaded',
		FILTER_BY_SELECTION	  : 'filter.selection',
		HIGHTLIGHT_PERMLINKED : 'hightlight.permlinked'
	};

	// Thumbs for content types (see ATTACHMENTS_FILTER)
	var EXTENSIONS_THUMBS = {
		'pdf': '/img/contenttypes/pdf.png'
	};


	// Roadmap module
	angular.module('nxroadmap', [])

	// Required in order to remove the 'unsafe' prefix added in links hrefs
	.config(['$compileProvider', function($compileProvider) {
  		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|blob):/);
	}])

	// This directive automatically add an 'attachments' property on the available issue for the current scope
	.directive('issueAttachments', function(jira, roadmap, $timeout) {
	  return {
	    compile: function(element, attributes) {
	    	return {
	            pre: function(scope, element, attributes, controller, transcludeFn) {
	            	// Cache the element in order to use it in the controller function
	            	scope.elm = element;
	            },
	            post: function(scope, element, attributes, controller, transcludeFn) {
	            	//
	            }
	        };
     	},
	    controller: function($scope) {
	    	// Check if we have already proceed the attachments for this issue
	    	if($scope.issue.attachments !== undefined) {
	    		console.log('files are already present');
	    		return;
	    	}

	    	// Download attachments for the current issue
			jira.getAttachments($scope.issue.id, function(files) {
				var attachments = [];
				for(var name in files) {
					var file 		= files[name];
					var extension   = extensionOf(name);
					var contentType = contentTypeOf(extension);
					var blob    	= new Blob([file._data.getContent()], {
						'type': contentType
					});

					var blobUrl = URL.createObjectURL(blob);
					var thumb   = roadmap.getExtensionThumb(extension);
					if(! thumb) {
						thumb = blobUrl;
					}

					attachments.push({
						// The file blob url
						'url'  : blobUrl,
						// The thumb image that is visible on an issue footer
						'thumb': thumb,
						// Currently the file is an image if the two url are the same (images can be used for preview but not the other types like pdf so we use a specific image to preview the file)
						'image': (blobUrl === thumb),
						// The name of the file
						'name' : name
					});
				}

				$scope.$evalAsync(function() {
					// Cache the attachments with the issue
					$scope.issue.attachments = attachments;
					if($scope.permlinked === $scope.issue.id) {
						// Resize the popup if this issue is permlinked
						$timeout(function() {
							$.colorbox.resize();
						});
					}
				});
			}, ATTACHMENTS_FILTER);
	    }
	  };
	})

	.directive('popoverHack', function($timeout) {
		return {
			link: function($scope, elm, attrs) {
				if($scope.$last === true) {
					$timeout(function() {
						$('div[data-issue]').each(function(i, elm) {
							var issueId = $(elm).data('issue');
							$('#title-' + issueId).popover({
								trigger: 'click',
								html: true,
								title: 'Permalink',
								content: '<div class="form-group"> ' +
				            		'<input size="27" type="text" onFocus="this.select()" class="form-control" value="'+ HOST +'/#/issues/'+ issueId +'">' +
				        		'</div>'
							});
						});
					});
				}
			}
	  	};
	})

	// Wrap jira plugin call
	.factory('jira', [function() {
		return {
			getVersions: function(callback) {
				return $.jira('versions', {
					'project': JIRA_PROJECT,
					'url'    : JIRA_BASE_URL
				}).done(callback);
			},
			getComponents: function(callback) {
				return $.jira('components', {
					'project': JIRA_PROJECT,
					'url'    : JIRA_BASE_URL
				}).done(callback);
			},
			getIssues: function(versions) {
				return $.jira('issues', {
					'project'	: JIRA_PROJECT,
					'url'		: JIRA_BASE_URL,
					'version'	: versions,
					'fields'	: [
						'fixVersions', 'components', 'priority', 'description', 'summary', 'status',
						'customfield_10902', 'customfield_10903', 'customfield_10899',
						'customfield_10900', 'customfield_10901', 'customfield_10904'
					]
				});
			},
			getAttachments: function(issueId, callback, filter) {
				$.jira('attachments', {
					'url': JIRA_BASE_URL,
					'issue': issueId,
					'extract': {
						'callback': callback,
						'filter'  : filter
					}
				});
			}
		};
	}])

	.factory('roadmap', [function() {
		return {
			getExtensionThumb: function(contentType) {
				return EXTENSIONS_THUMBS[contentType];
			},
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

	// Ordered the passed issues by priority
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
				// TODO: Add the lts id to the versionsIds only if the current selection is a lts
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
	.controller('root', function($scope, $sce, roadmap, $timeout) {
		$scope.isPermlinked = function(issue) {
			return $scope.permlinked == issue.id;
		};

		$scope.fireHightlightPermlinked = function() {
			$scope.$broadcast(NXEVENT.HIGHTLIGHT_PERMLINKED);
		};

		$scope.filterIssuesByVersion = function(versionId) {
			// Short circuit the broadcasts if the clicked version is already selected
			if(versionId === roadmap.getVersionSelection().id) {
				console.log('Version already selected');
				return;
			}

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

		//TODO : Fix incoherence
		$scope.filterIssuesByLts = function(ltsId, clear, callback) {
			// If clear is set to true then unselect the current active ft version
			if(clear === true) {
				$('#versions .active').removeClass('active');
			}

			var selection = roadmap.getVersionSelection();
			if(ltsId != selection.id) {
				$('.collapse.in').collapse('hide');
				$('#collapse-' + ltsId).collapse('show');

				// Force to use a version selection in order to avoid weird behavior when a LTS is selected
				$scope.$broadcast(NXEVENT.FILTER_BY_SELECTION, {
					lts: true,
					id : ltsId
				});
			}

			if(typeof callback === 'function') {
				callback(ltsId == selection.id);
			}
		};

		$scope.trusted = function(input) {
			return $sce.trustAsHtml(input);
		};
	})

	// specific controllers

	.controller('versions', function($scope, $timeout, jira) {
		// Load jira roadmap project versions
		jira.getVersions(function(data, status) {
			lookup(ISSUE_LOADER_SELECTOR).nxloader('show');
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
			lookup('a[data-version]').removeClass('active');
			// Apply the active class on the selected ft
			lookup('a[data-version=' + versionId + ']').addClass('active');
		});

		$scope.isResolved = function(issue) {
			return issue.fields.status.name === 'Resolved';
		};

		$scope.showImage = function($event, issueId) {
			var elm = $($event.currentTarget);
	        $('a.img-issue-' + issueId).colorbox({
	        	'rel'  		: 'img-issue-' + issueId,
	        	'photo' 	: true,
	        	'maxHeight'	: '92%'
	        });
		};

		$scope.$on(NXEVENT.HIGHTLIGHT_PERMLINKED, function(event) {
			$timeout(function() {
				// Close the current popover if displayed
				if($('.popover').size() > 0) {
					console.log('Hide popover');
					$('#title-' + $scope.permlinked).click();
				}

				hightlightPermlinked();
			});
		});

		$scope.$on(NXEVENT.VERSIONS_LOADED, function(event, versions) {
			$scope.versions = VERSIONS = versions;

			var callbacks = [];
			// Prepare an array of deferred which old issues querying for one LTS and it's associated FTs
			for(var vId in versions.versionsIds) {
				var ids = versions.versionsIds[vId];
				ids.push(vId);

				callbacks.push(jira.getIssues(ids));
			}

			// Use the jquery promise api to chain issues call and invoke our callback once requests are done
			$.when.apply($, callbacks).done(function() {
				// Will hold the results (issues) of each http call to jira
				var collectedIssues = [];

				// Collect the LTS call response data in one array (collectedIssues)
				for(var i in arguments) {
					var params = arguments[i];
					if(params[1] !== 'success') {
						throw new Error('The request for the jira issues request respond with status ' + params[2].statusText);
					}

					// Merge the current issues data with the old one
					collectedIssues = $.merge(params[0].issues, collectedIssues);
				}

				// Hide the issues loader
				lookup(ISSUE_LOADER_SELECTOR, true).nxloader('hide', {
					callback: function(elm) {
						elm.remove();
					}
				});

				// Bind the handler functions to $scope.$parent
				for(var key in ROUTES) {
					var routeItem = ROUTES[key];
					if(routeItem.scoped === undefined || routeItem.scoped === true) {
						routeItem.scopedHandler = function() {
							var args = arguments;
							$timeout(function() {
								routeItem.handler.apply($scope.$parent, args);
							});
						};
					}
				}

				$scope.$apply(function() {
					// Filter issues by priority, cache them and update scope
					CACHE = $filter('priority')(collectedIssues);

					if(window.location.hash) {
						console.debug('We have a location hash - trigger hashchange');
						// Trigger hashchange when versions and issues has been loaded
						$(window).trigger('hashchange');
						return;
					}

					// Open the panel which hold the current LTS and retrieve this version id
					var ltsId = $('.panel-info div[role=tabpanel]')
						//.addClass('in')
						.parent('.panel')
						.attr('data-version');
					// Fire event which will take care of LTS filtering based on the current LTS
					$scope.filterIssuesByLts(ltsId);
				});
			});
		});

		// Filter issues based on the current selection
		$scope.$on(NXEVENT.FILTER_BY_SELECTION, function(event, versionSelection) {
			if($scope.issues === undefined) {
				// Lazy set the issues in the scope - avoid early call to the permlinked directive
				$scope.issues = CACHE;
			}

			var selection = null;
			if(versionSelection) {
				// Force usage of the passed selection
				selection = {
					components	: roadmap.getComponentsSelection(),
					version 	: versionSelection
				}
			}
			else {
				// Fetch the current selection
				selection = roadmap.getSelection();
			}

			$timeout(function() {
				// Reduce the displayed issues based on a selection
				$scope.issues = $filter('reduce')(CACHE, $scope.versions, selection);
			});
		});
	})

	;
})();