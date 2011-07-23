/* use this SCSS:

ul.slideshow {
	list-style: none;
	width: 294px;
	height: 286px;
	float: right;
	overflow: hidden;
	position: relative;
	margin: 0;
	padding: 0;
	padding-left: 0.5em;

	li {
		position: absolute;
		left: 0;
		right: 0;
	}

	li.show {
		z-index: 500;
	}
}

 */
function start_slideshow(speed)
{
	// Set the opacity of all images to 0
	$('ul.slideshow li').css({opacity: 0.0});
	
	// Get the first image and display it (set it to full opacity)
	$('ul.slideshow li:first').css({opacity: 1.0});
	
	// Call the gallery function to run the slideshow	
	var timer = setInterval('gallery()', speed);
	
	// Pause the slideshow on mouse over
	$('ul.slideshow').hover(
		function () {
			clearInterval(timer);	
		}, 	
		function () {
			timer = setInterval('gallery()', speed);			
		}
	);
}

function gallery()
{
	// If no IMGs have the show class, grab the first image
	var current = ($('ul.slideshow li.show') ?
			$('ul.slideshow li.show')
			: $('#ul.slideshow li:first'));

	// Get next image, or loop back to the first image
	var next = ((current.next().length) ?  current.next() : $('ul.slideshow li:first'));
		
	// Set the fade in effect for the next image, show class has higher z-index
	next.css({opacity: 0.0}).addClass('show').animate({opacity: 1.0}, 1000);
	
	// Hide the current image
	current.animate({opacity: 0.0}, 1000).removeClass('show');
}
