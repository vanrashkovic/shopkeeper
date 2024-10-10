jQuery(function($) {

	"use strict";

	// frame or not?
	if (window.self == window.top) {
		$("body").addClass("gbt-mft-plugin");
	}

	$('.getbowtied-toolbar-dropdown').on('click', '.getbowtied-toolbar-button', function() {
		$('.getbowtied-toolbar-dropdown').toggleClass('active');
    });

});