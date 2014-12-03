'use strict';

/**
 * Jquery zip plugin
 *
 * Exposed method:
 *      - nxzip: Uncompress a zip archive
 * 
 */

(function($) {
    // Utility functions
    var functions = {
        // Safely get options
        getOptions: function(options) {
            return $.extend({
                // 
            }, options);
        },
        // Exposed for the jquery 'zip' plugin
        exposed: { 
            uncompress: function(options) {
                if(! window.JSZipUtils || ! window.JSZip) {
                    throw new Error('You have to load the jszip and jszip-utils api in order to invoke the extract action');
                }

                options     = functions.getOptions(options);

                // Check zip url
                var url     = options.url;
                if(! url) {
                    throw new Error('You must provide a zip file url in the option named \'url\'');
                }

                // Check completion callback
                var callback = options.callback;
                if(typeof callback !== 'function') {
                    throw new Error('You must provide a callback function in the option named \'callback\'');
                }

                // Fetch the archive
                JSZipUtils.getBinaryContent(url, function(err, data) {
                    if(err) {
                        throw err;
                    }

                    // Create a new jszip instance in order to read the archive
                    var zip     = new JSZip(data);
                    // The final files which will be passed to the callback
                    var files   = [];
                    // A filter that can reduce the files that will be passed to the callback
                    var filter  = options.filter;
                    // A filter in any object that has a 'test' method
                    if(filter && typeof filter.test === 'function') {
                        console.log('A filter has been detected ... process filter');
                        // Iter on each files and check the filter
                        for(var i in zip.files) {
                            var file = zip.files[i];
                            // Check if the file pass the filter
                            if(filter.test(file.name)) {
                                files.push(file);
                            }
                        }
                    }
                    else {
                        files = zip.files;
                    }

                    zip.files   = null;
                    zip         = null;

                    callback(files);
                });
            },
            // Simple alias to the functions.exposed.uncompress method
            extract : function() {
                return functions.exposed.uncompress.apply(this, arguments);
            }
        }
    };

    $.nxzip = function(action, options) {
       var func = functions.exposed[action];
        if(! func) {
            throw new Error('The \'action\' action doesn\'t exists');
        }

        // Dispatch the call to the target action
        func.apply(this, [options]);

        return this;
    };

})(jQuery);

