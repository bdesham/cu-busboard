var slideshow_on = true;
var slideshow_speed = 1000;
var slideshow_delay = 5000;

function start_slideshow()
{
	// Set the opacity of all images to 0
	$('ul.slideshow li').css({opacity: 0.0});
	
	// Get the first image and display it (set it to full opacity)
	$('ul.slideshow li:first').css({opacity: 1.0});

	gallery();
	
	// Pause the slideshow on mouse over
	$('ul.slideshow').hover(
		function () {
			slideshow_on = false;
		}, 	
		function () {
			slideshow_on = true;
			gallery();
		}
	);
}

function gallery()
{
	if (!slideshow_on)
		return;

	// If no IMGs have the show class, grab the first image
	var current = ($('ul.slideshow li.show') ?
			$('ul.slideshow li.show')
			: $('#ul.slideshow li:first'));

	// Get next image, or loop back to the first image
	var next = ((current.next().length) ?  current.next() : $('ul.slideshow li:first'));
		
	// Set the fade in effect for the next image, show class has higher z-index
	next.css({opacity: 0.0}).addClass('show').animate({opacity: 1.0}, slideshow_speed);
	
	// Hide the current image
	current.animate({opacity: 0.0}, slideshow_speed, function(){
			setTimeout('gallery();', slideshow_delay);
		}).removeClass('show');
}
