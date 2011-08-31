/*
 * Animate through a series of images with jQuery
 *
 * Given a <ul> containing a bunch of images in its list items (see the example
 * HTML file), this script collapses the list into one image, and fades between
 * the images indefinitely. (Animation is disabled if the user mouses over the
 * image.) The amount of time each image is shown and the speed of the animation
 * are configurable.
 *
 * Adapted by Benjamin Esham (http://www.bdesham.info) from a jQuery [tutorial]
 * by Kevin Liew. This version removes the caption and tightens up the code,
 * making it work correctly with jQuery 1.6. Benjamin Esham releases his changes
 * into the public domain.
 *
 * [tutorial]: http://www.queness.com/post/1450/jquery-photo-slide-show-with-slick-caption-tutorial-revisited
 */

// length of time (in milliseconds) each transition (e.g. fading in) will take

var slideshow_speed = 1000;

// length of time (in milliseconds) each image is shown

var slideshow_delay = 5000;

// global variables

var slideshow_on = true;
var slideshow_timeout;

// slideshow_start
//
// Starts the slideshow up. Call this when the page loads, like
//
//     $(document).ready(function() {
//         slideshow_start();
//     });

function slideshow_start()
{
	// jQuery's fadeIn() and fadeOut() seem to work separately from the CSS
	// `opacity` property (although judging from the jQuery source, this should
	// not be the case!). In the page's CSS--which probably loads before
	// slideshow_start() is run--the images other than the first are made
	// invisible so that they are not displayed under the first image. In the
	// next line we restore their CSS opacity to 1, but only after calling
	// jQuery's fadeOut() on them. Fading them out ensures that they are never
	// shown under the first image; setting their opacity back to 1 means they
	// will appear when we get around to calling fadeIn() on them.
	$('ul.slideshow li').not('.show').fadeOut(0).css({opacity: 1.0});
	$('ul.slideshow li.show').css({opacity: 1.0});
	
	// Pause the slideshow on mouse over
	$('ul.slideshow').hover(
		function () {
			slideshow_on = false;
			clearTimeout(slideshow_timeout);
		}, 	
		function () {
			slideshow_on = true;
			slideshow_queue_animation();
		}
	);

	slideshow_queue_animation();
}

// slideshow_queue_animation
//
// Requests a transition after waiting for slideshow_delay milliseconds. This
// properly clears any existing timeout, so call this instead of calling
// slideshow_animate() directly.

function slideshow_queue_animation()
{
	clearTimeout(slideshow_timeout);
	slideshow_timeout = setTimeout(slideshow_animate, slideshow_delay);
}

// slideshow_animate
//
// Performs the animation and sets a timeout for the next one. Call
// slideshow_queue_animation instead of calling this directly.

function slideshow_animate()
{
	clearTimeout(slideshow_timeout);

	if (!slideshow_on) {
		// setTimeout(slideshow_animate) was called, but in the meantime
		// the slideshow has been stopped (e.g. by the user mousing over the
		// image)
		return;
	}

	// If none of the list items has the "show" class, use the first image
	var current = ($('ul.slideshow li.show')
			? $('ul.slideshow li.show')
			: $('ul.slideshow li:first'));

	// Get the next image or loop back to the first image
	var next = ((current.next().length)
			? current.next()
			: $('ul.slideshow li:first'));
		
	next.addClass('show').fadeIn(slideshow_speed);
	
	current.removeClass('show').fadeOut(slideshow_speed, function(){
			slideshow_queue_animation();
		});
}

// vim: tw=80 cc=+1
