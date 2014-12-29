'use strict';

/**
 * Jquery zip plugin
 *
 * Exposed method:
 *      - nxzip: Uncompress a zip archive
 * 
 */

(function($) {

    var ZIP_REGEX       = /\.zip$/i;
    var MAC_OSX_REGEX   = /^__MACOSX/i;

    // Utility functions
    var functions = {
        // Safely get options
        getOptions: function(options) {
            // Nothing to do
            return options;
        },
        /*
         * The options object must look like:
         *      - data: The binary content of the zip file
         *      - filter: A regex that will be used in order to reduce the files
         */
        unzip: function(options) {
            var data    = options.data;
            if(! data) {
                throw new Error('data must be a valid object');
            }

            var filter      = options.filter;
            var applyFilter = typeof filter.test == 'function';
            var zip         = new JSZip(data);
            var files       = {};

            for(var i in zip.files) {
                var file = zip.files[i];
                var name = file.name;

                if(MAC_OSX_REGEX.test(name)) {
                    // Ignore macosx content
                    continue;
                }

                if(ZIP_REGEX.test(name)) {
                    console.log('Found zip file ... recursive process');
                    // Get the inner files
                    files[name] = functions.unzip({
                        'data'  : file.asBinary(),
                        'filter': filter
                    });

                    console.log('Zip file processing done');
                }
                else if(applyFilter && filter.test(name)) {
                    files[name] = file;
                }
            }

            return files;
        } ,
        // Exposed for the jquery 'zip' plugin
        exposed: { 
            extract: function(options) {
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
                        console.log('Error when downloading the zip');
                        console.debug(arguments);
                        throw err;
                    }

                    var files = functions.unzip({
                        'data'  : data,
                        'filter': options.filter
                    });

                    callback(files);
                });
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

