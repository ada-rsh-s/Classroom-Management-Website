//[Master Javascript]



+function ($) {
  'use strict'
	
// Dynamic active menu
    var path = window.location.pathname.split("/").pop();
    var target = $('.menu li a[href="'+path+'"]');
    target.parent().addClass('active');
    $('.menu li.active').parents('li').addClass('active');

}(jQuery) // End of use strict


/*!
 * Waves v0.6.4
 * http://fian.my.id/Waves
 *
 * Copyright 2014 Alfiana E. Sibuea and other contributors
 * Released under the MIT license
 * https://github.com/fians/Waves/blob/master/LICENSE
 */

;(function(window) {
    'use strict';

    var Waves = Waves || {};
    var $$ = document.querySelectorAll.bind(document);

    // Find exact position of element
    function isWindow(obj) {
        return obj !== null && obj === obj.window;
    }

    function getWindow(elem) {
        return isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
    }

    function offset(elem) {
        var docElem, win,
            box = {top: 0, left: 0},
            doc = elem && elem.ownerDocument;

        docElem = doc.documentElement;

        if (typeof elem.getBoundingClientRect !== typeof undefined) {
            box = elem.getBoundingClientRect();
        }
        win = getWindow(doc);
        return {
            top: box.top + win.pageYOffset - docElem.clientTop,
            left: box.left + win.pageXOffset - docElem.clientLeft
        };
    }

    function convertStyle(obj) {
        var style = '';

        for (var a in obj) {
            if (obj.hasOwnProperty(a)) {
                style += (a + ':' + obj[a] + ';');
            }
        }

        return style;
    }

    var Effect = {

        // Effect delay
        duration: 750,

        show: function(e, element) {

            // Disable right click
            if (e.button === 2) {
                return false;
            }

            var el = element || this;

            // Create ripple
            var ripple = document.createElement('div');
            ripple.className = 'waves-ripple';
            el.appendChild(ripple);

            // Get click coordinate and element witdh
            var pos         = offset(el);
            var relativeY   = (e.pageY - pos.top);
            var relativeX   = (e.pageX - pos.left);
            var scale       = 'scale('+((el.clientWidth / 100) * 10)+')';

            // Support for touch devices
            if ('touches' in e) {
              relativeY   = (e.touches[0].pageY - pos.top);
              relativeX   = (e.touches[0].pageX - pos.left);
            }

            // Attach data to element
            ripple.setAttribute('data-hold', Date.now());
            ripple.setAttribute('data-scale', scale);
            ripple.setAttribute('data-x', relativeX);
            ripple.setAttribute('data-y', relativeY);

            // Set ripple position
            var rippleStyle = {
                'top': relativeY+'px',
                'left': relativeX+'px'
            };

            ripple.className = ripple.className + ' waves-notransition';
            ripple.setAttribute('style', convertStyle(rippleStyle));
            ripple.className = ripple.className.replace('waves-notransition', '');

            // Scale the ripple
            rippleStyle['-webkit-transform'] = scale;
            rippleStyle['-moz-transform'] = scale;
            rippleStyle['-ms-transform'] = scale;
            rippleStyle['-o-transform'] = scale;
            rippleStyle.transform = scale;
            rippleStyle.opacity   = '1';

            rippleStyle['-webkit-transition-duration'] = Effect.duration + 'ms';
            rippleStyle['-moz-transition-duration']    = Effect.duration + 'ms';
            rippleStyle['-o-transition-duration']      = Effect.duration + 'ms';
            rippleStyle['transition-duration']         = Effect.duration + 'ms';

            rippleStyle['-webkit-transition-timing-function'] = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';
            rippleStyle['-moz-transition-timing-function']    = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';
            rippleStyle['-o-transition-timing-function']      = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';
            rippleStyle['transition-timing-function']         = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';

            ripple.setAttribute('style', convertStyle(rippleStyle));
        },

        hide: function(e) {
            TouchHandler.touchup(e);

            var el = this;
            var width = el.clientWidth * 1.4;

            // Get first ripple
            var ripple = null;
            var ripples = el.getElementsByClassName('waves-ripple');
            if (ripples.length > 0) {
                ripple = ripples[ripples.length - 1];
            } else {
                return false;
            }

            var relativeX   = ripple.getAttribute('data-x');
            var relativeY   = ripple.getAttribute('data-y');
            var scale       = ripple.getAttribute('data-scale');

            // Get delay beetween mousedown and mouse leave
            var diff = Date.now() - Number(ripple.getAttribute('data-hold'));
            var delay = 350 - diff;

            if (delay < 0) {
                delay = 0;
            }

            // Fade out ripple after delay
            setTimeout(function() {
                var style = {
                    'top': relativeY+'px',
                    'left': relativeX+'px',
                    'opacity': '0',

                    // Duration
                    '-webkit-transition-duration': Effect.duration + 'ms',
                    '-moz-transition-duration': Effect.duration + 'ms',
                    '-o-transition-duration': Effect.duration + 'ms',
                    'transition-duration': Effect.duration + 'ms',
                    '-webkit-transform': scale,
                    '-moz-transform': scale,
                    '-ms-transform': scale,
                    '-o-transform': scale,
                    'transform': scale,
                };

                ripple.setAttribute('style', convertStyle(style));

                setTimeout(function() {
                    try {
                        el.removeChild(ripple);
                    } catch(e) {
                        return false;
                    }
                }, Effect.duration);
            }, delay);
        },

        // Little hack to make <input> can perform waves effect
        wrapInput: function(elements) {
            for (var a = 0; a < elements.length; a++) {
                var el = elements[a];

                if (el.tagName.toLowerCase() === 'input') {
                    var parent = el.parentNode;

                    // If input already have parent just pass through
                    if (parent.tagName.toLowerCase() === 'i' && parent.className.indexOf('waves-effect') !== -1) {
                        continue;
                    }

                    // Put element class and style to the specified parent
                    var wrapper = document.createElement('i');
                    wrapper.className = el.className + ' waves-input-wrapper';

                    var elementStyle = el.getAttribute('style');

                    if (!elementStyle) {
                        elementStyle = '';
                    }

                    wrapper.setAttribute('style', elementStyle);

                    el.className = 'waves-button-input';
                    el.removeAttribute('style');

                    // Put element as child
                    parent.replaceChild(wrapper, el);
                    wrapper.appendChild(el);
                }
            }
        }
    };


    /**
     * Disable mousedown event for 500ms during and after touch
     */
    var TouchHandler = {
        /* uses an integer rather than bool so there's no issues with
         * needing to clear timeouts if another touch event occurred
         * within the 500ms. Cannot mouseup between touchstart and
         * touchend, nor in the 500ms after touchend. */
        touches: 0,
        allowEvent: function(e) {
            var allow = true;

            if (e.type === 'touchstart') {
                TouchHandler.touches += 1; //push
            } else if (e.type === 'touchend' || e.type === 'touchcancel') {
                setTimeout(function() {
                    if (TouchHandler.touches > 0) {
                        TouchHandler.touches -= 1; //pop after 500ms
                    }
                }, 500);
            } else if (e.type === 'mousedown' && TouchHandler.touches > 0) {
                allow = false;
            }

            return allow;
        },
        touchup: function(e) {
            TouchHandler.allowEvent(e);
        }
    };


    /**
     * Delegated click handler for .waves-effect element.
     * returns null when .waves-effect element not in "click tree"
     */
    function getWavesEffectElement(e) {
        if (TouchHandler.allowEvent(e) === false) {
            return null;
        }

        var element = null;
        var target = e.target || e.srcElement;

        while (target.parentNode !== null) {
            if (!(target instanceof SVGElement) && target.className.indexOf('waves-effect') !== -1) {
                element = target;
                break;
            }
            target = target.parentNode;
        }
        return element;
    }

    /**
     * Bubble the click and show effect if .waves-effect elem was found
     */
    function showEffect(e) {
        var element = getWavesEffectElement(e);

        if (element !== null) {
            Effect.show(e, element);

            if ('ontouchstart' in window) {
                element.addEventListener('touchend', Effect.hide, false);
                element.addEventListener('touchcancel', Effect.hide, false);
            }

            element.addEventListener('mouseup', Effect.hide, false);
            element.addEventListener('mouseleave', Effect.hide, false);
            element.addEventListener('dragend', Effect.hide, false);
        }
    }

    Waves.displayEffect = function(options) {
        options = options || {};

        if ('duration' in options) {
            Effect.duration = options.duration;
        }

        //Wrap input inside <i> tag
        Effect.wrapInput($$('.waves-effect'));

        if ('ontouchstart' in window) {
            document.body.addEventListener('touchstart', showEffect, false);
        }

        document.body.addEventListener('mousedown', showEffect, false);
    };

    /**
     * Attach Waves to an input element (or any element which doesn't
     * bubble mouseup/mousedown events).
     *   Intended to be used with dynamically loaded forms/inputs, or
     * where the user doesn't want a delegated click handler.
     */
    Waves.attach = function(element) {
        //FUTURE: automatically add waves classes and allow users
        // to specify them with an options param? Eg. light/classic/button
        if (element.tagName.toLowerCase() === 'input') {
            Effect.wrapInput([element]);
            element = element.parentNode;
        }

        if ('ontouchstart' in window) {
            element.addEventListener('touchstart', showEffect, false);
        }

        element.addEventListener('mousedown', showEffect, false);
    };

    window.Waves = Waves;

    document.addEventListener('DOMContentLoaded', function() {
        Waves.displayEffect();
    }, false);

})(window);

    $(function () {
	  $('[data-toggle="tooltip"]').tooltip({
            trigger : 'hover'
        })
    });


//accordian start
	$(function(){
	  $('.tab-wrapper.v1 .item .tab-btn a').click(function(e){
		e.preventDefault();

		var _item     = $(this).closest('.item');
		var _hasClass = 'selected';
		var _all      = $('.tab-wrapper.v1 .item');

		if(_item.hasClass(_hasClass)){
		  _item.find('.tab-btn a em').removeClass('mdi-minus').addClass('mdi-plus')
				.closest('.item')
				.find('.tab-content')
				.stop()
				.slideUp(400, function(){
				  _item.removeClass('selected');
				});

		}else{
		  _all.find('.tab-btn a em').removeClass('mdi-minus').addClass('mdi-plus')
				.closest('.item')
				.find('.tab-content')
				.stop()
				.slideUp(400, function(){
				  _all.removeClass('selected');
				});

		  _item.find('.tab-btn a em').removeClass('mdi-plus').addClass('mdi-minus')
				.closest('.item')
				.find('.tab-content')
				.stop()
				.slideDown(400, function(){
				  _item.addClass('selected');
				});
		}
	  });

	  $('.tab-wrapper.v2 .tab-btn a').click(function(e){
		e.preventDefault();

		var _this       = $(this);
		var _hasClass   = 'selected';
		var _category   = _this.data('category');
		var _content    = $('.tab-wrapper.v2 .tab-content .item');
		var _all        = $('.tab-wrapper.v2 .tab-btn a');

		if(_this.hasClass(_hasClass)){

		}else{
		  _all.removeClass(_hasClass).find('em').removeClass('mdi-minus').addClass('mdi-plus');
		  _this.addClass(_hasClass).find('em').removeClass('mdi-plus').addClass('mdi-minus');

		  _content.each(function(){
			var _value   = $(this).data('value');

			$(this).removeClass(_hasClass).stop().hide();

			if(_value == _category){
			  $(this).stop()
					  .fadeIn('slow', function(){
						$(this).addClass(_hasClass);
					  });
			}
		  });
		}

	  });
	});
	//accordian end


$(function () {
    "use strict";   

		
	
	jQuery(window).scroll(startCounter);
	function startCounter() {
		var hT = jQuery('.countnm-bx').offset().top,
			hH = jQuery('.countnm-bx').outerHeight(),
			wH = jQuery(window).height();
		if (jQuery(window).scrollTop() > hT+hH-wH) {
			jQuery(window).off("scroll", startCounter);
			jQuery('.countnm').each(function () {
				var $this = jQuery(this);
				jQuery({ Counter: 0 }).animate({ Counter: $this.text() }, {
					duration: 2000,
					easing: 'swing',
					step: function () {
						$this.text(Math.ceil(this.Counter) + '%');
					}
				});
			});
		}
	}
	
	
  }); // End of use strict


$(function () {
	"use strict"; 
		var checkSelectorExistence = function(selectorName) {
		  if(jQuery(selectorName).length > 0){return true;}else{return false;}
		};

		if(!checkSelectorExistence('.placeholdertx')){return;}
		$('.placeholdertx input, .placeholdertx textarea').focus(function(){
		  $(this).parents('.form-group').addClass('focused');
		});

		$('.placeholdertx input, .placeholdertx textarea').blur(function(){
		  var inputValue = $(this).val();
		  if ( inputValue == "" ) {
			$(this).removeClass('filled');
			$(this).parents('.form-group').removeClass('focused');  
		  } else {
			$(this).addClass('filled');
		  }
		});
}); // End of use strict


$(function () {
      var owlslider = jQuery("div.owl-carousel");
        owlslider.each(function () {
        var $this = $(this),
              $items = ($this.data('items')) ? $this.data('items') : 1,
              $loop = ($this.attr('data-loop')) ? $this.data('loop') : true,
              $navdots = ($this.data('nav-dots')) ? $this.data('nav-dots') : false,
              $navarrow = ($this.data('nav-arrow')) ? $this.data('nav-arrow') : false,
              $autoplay = ($this.attr('data-autoplay')) ? $this.data('autoplay') : true,
              $autohgt = ($this.data('autoheight')) ? $this.data('autoheight') : false,
              $autowdt = ($this.data('autoWidth')) ? $this.data('autoWidth') : true,
              $space = ($this.attr('data-space')) ? $this.data('space') : 20;
         
              $(this).owlCarousel({
                  loop: $loop,
                  items: $items,
                  responsive: {
                    0:{items: $this.data('xx-items') ? $this.data('xx-items') : 1},
                    480:{items: $this.data('xs-items') ? $this.data('xs-items') : 1},
                    768:{items: $this.data('sm-items') ? $this.data('sm-items') : 2},
                    980:{items: $this.data('md-items') ? $this.data('md-items') : 3},
                    1200:{items: $items}
                  },
                  dots: $navdots,
                  autoHeight:$autohgt,
                  margin:$space,
                  nav: $navarrow,
                  navText:["<i class='fa fa-angle-left fa-2x'></i>","<i class='fa fa-angle-right fa-2x'></i>"],
                  autoplay: $autoplay,
                  autoplayHoverPause: true,
              });

       }); 
 });

$(function () {
	
	 AOS.init({
		easing: 'ease-in-out-sine'
	  });

});


var options = {
	title: 'This website uses cookies.<br> The General Data Protection Regulation (GDPR) and the ePrivacy Directive (ePR) affect how you as a website owner may use cookies and online tracking of visitors from the EU.',
	message: 'We use cookies to personalise content and ads, to provide social media features and to analyse our traffic. We also share information about your use of our site with our social media, advertising and analytics partners who may combine it with other information that you’ve provided to them or that they’ve collected from your use of their services',
	delay: 600,
	expires: 1,
	link: '#privacy',
	onAccept: function(){
		var myPreferences = $.fn.ihavecookies.cookie();
		console.log('Yay! The following preferences were saved...');
		console.log(myPreferences);
	},
	uncheckBoxes: true,
	acceptBtnLabel: 'Accept Cookies',
	moreInfoLabel: '',
	cookieTypesTitle: 'Select which cookies you want to accept',
	fixedCookieTypeLabel: 'Essential',
	fixedCookieTypeDesc: 'These are essential for the website to work correctly.'
}

$(document).ready(function() {
	$('body').ihavecookies(options);

	if ($.fn.ihavecookies.preference('marketing') === true) {
		console.log('This should run because marketing is accepted.');
	}

	$('#ihavecookiesBtn').on('click', function(){
		$('body').ihavecookies(options, 'reinit');
	});
});


