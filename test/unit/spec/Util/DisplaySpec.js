/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define (
	[
		'jquery',
		'util/display'
	], function(
		$,
		DisplayUtil
	) {
    'use strict';

    describe('KBase Display Utility function module', function() {


        it('getAppIcon() should create a default icons for methods and apps', function() {
            var $icon = DisplayUtil.getAppIcon({});
            expect($icon.html()).toContain('method-icon');
            expect($icon.html()).not.toContain('app-icon');

            var $icon = DisplayUtil.getAppIcon({isApp:true});
            expect($icon.html()).toContain('app-icon');
            expect($icon.html()).not.toContain('method-icon');
        });

        it('getAppIcon() should create a default icons with urls', function() {
            var $icon = DisplayUtil.getAppIcon({url:'https://kbase.us/someimg.png'});
            // right now icon is directly an image, but might not always be the case, so
            // test that we can find the url
            expect($('<div>').append($icon).html()).toContain('https://kbase.us/someimg.png');
            expect($('<div>').append($icon).html()).not.toContain('method-icon');
            expect($('<div>').append($icon).html()).toContain('default');
            expect($('<div>').append($icon).html()).not.toContain('app-icon');
        });

        it('getAppIcon() should use the cursor option', function() {
            var $icon = DisplayUtil.getAppIcon({url:'https://kbase.us/someimg.png', cursor:'pointer'});
            expect($('<div>').append($icon).html()).toContain('https://kbase.us/someimg.png');
            expect($('<div>').append($icon).html()).toContain('pointer');
            expect($('<div>').append($icon).html()).not.toContain('method-icon');
            expect($('<div>').append($icon).html()).not.toContain('app-icon');

            $icon = DisplayUtil.getAppIcon({cursor:'pointer'});
            expect($('<div>').append($icon).html()).toContain('pointer');
            expect($('<div>').append($icon).html()).toContain('method-icon');
            expect($('<div>').append($icon).html()).not.toContain('app-icon');
        });


    });
});