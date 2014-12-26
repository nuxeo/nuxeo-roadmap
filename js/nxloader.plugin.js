(function($) {

	$.fn.nxloader = function(action, options) {
		var self = $(this);

		if(! options) {
			options = {};
		}

		if(action === 'show') {
			var height = options.height || '32px';
			var width  = options.width  || '100%';
			var img    = options.img    || '/img/loader.svg';

			self.show().html('<img src="'+ img +'" height="' + height + '" width="' + width + '"/>');

			if(typeof options.callback === 'function') {
				options.callback(self);
			}
		} else if(action === 'hide') {
			self.html('');

			if(typeof options.callback === 'function') {
				options.callback(self);
			}
		}

		return this;
	};
})(jQuery)