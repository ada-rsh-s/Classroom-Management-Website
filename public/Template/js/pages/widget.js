//Initialize nice select

$(function () {
    "use strict";   

	
		//Initialize Select2 Elements
		$('.select2').select2();
	
  }); // End of use strict


$(function () {
    "use strict";  
	$("#vertical-container").vTicker({ 
		speed: 500,
		pause: 3000,
		animation: 'fade',
		mousePause: false,
		showItems: 3
	});
	$("#vertical-container1").vTicker({ 
		speed: 300,
		pause: 4000,
		animation: 'fade',
		mousePause: true,
		showItems: 3
	});
	$("#vertical-container2").vTicker({ 
		speed: 300,
		pause: 4000,
		animation: 'fade',
		mousePause: true,
		showItems: 4
	});
	$("#vertical-container3").vTicker({ 
		speed: 300,
		pause: 4000,
		animation: 'fade',
		mousePause: true,
		showItems: 5
	});
	$("#vertical-container4").vTicker({ 
		speed: 300,
		pause: 4000,
		animation: 'fade',
		mousePause: true,
		showItems: 5
	});
	$('.inner-user-div').slimScroll({
		height: '342px',
	});
}); // End of use strict



