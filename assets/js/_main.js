/* ==========================================================================
   jQuery plugin settings and other scripts
   ========================================================================== */

$(document).ready(function(){
  // Sticky footer
  var bumpIt = function() {
      $("body").css("margin-bottom", $("#footer").outerHeight(true));
    },
    didResize = false;

  bumpIt();

  $(window).resize(function() {
    didResize = true;
  });
  setInterval(function() {
    if (didResize) {
      didResize = false;
      bumpIt();
    }
  }, 250);
  // FitVids init
  $("#main").fitVids();

  // init sticky sidebar
  $(".sticky").Stickyfill();

  var stickySideBar = function(){
    const MINIMUM_WIDTH = 1024;

    // Adjust if the follow button is shown based upon screen size
    const width = $(window).width();
    let show = $(".author__urls-wrapper button").length === 0 ? width > MINIMUM_WIDTH : !$(".author__urls-wrapper button").is(":visible");

    // Don't show the follow button if there is no content for it
    const count = $('.author__urls.social-icons li').length - $('.author__urls.social-icons li.author__desktop').length;
    if (width <= MINIMUM_WIDTH && count === 0) {
      $(".author__urls-wrapper button").hide();
      show = false;
    }

    if (show) {
      // fix
      Stickyfill.rebuild();
      Stickyfill.init();
      $(".author__urls").show();
    } else {
      // unfix
      Stickyfill.stop();
      $(".author__urls").hide();
    }
  };

  stickySideBar();

  $(window).resize(function(){
    stickySideBar();
  });

  // Follow menu drop down
  $(".author__urls-wrapper button").on("click", function() {
    $(".author__urls").fadeToggle("fast", function() {});
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // init smooth scroll, this needs to be slightly more than then fixed masthead height
  $("a").smoothScroll({offset: -65});

  // add lightbox class to all image links
  $("a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif']").addClass("image-popup");

  // Magnific-Popup options
  $(".image-popup").magnificPopup({
    type: 'image',
    tLoading: 'Loading image #%curr%...',
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0,1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      tError: '<a href="%url%">Image #%curr%</a> could not be loaded.',
    },
    removalDelay: 500, // Delay in milliseconds before popup is removed
    // Class that is added to body when popup is open.
    // make it unique to apply your CSS animations just to this exact popup
    mainClass: 'mfp-zoom-in',
    callbacks: {
      beforeOpen: function() {
        // just a hack that adds mfp-anim class to markup
        this.st.image.markup = this.st.image.markup.replace('mfp-figure', 'mfp-figure mfp-with-anim');
      }
    },
    closeOnContentClick: true,
    midClick: true // allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source.
  });

  // Add copy buttons to code blocks
  var addCopyButtons = function() {
    // Select all pre elements with code inside
    var codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(function(block) {
      // Create button element
      var button = document.createElement('button');
      button.className = 'copy-code-button';
      button.innerText = 'Copy';
      
      // Create a wrapper for the code block and button
      var wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      
      // Get the parent pre element
      var pre = block.parentNode;
      
      // Insert the wrapper before the pre element
      pre.parentNode.insertBefore(wrapper, pre);
      
      // Move the pre element inside the wrapper
      wrapper.appendChild(pre);
      
      // Add the button to the wrapper
      wrapper.appendChild(button);
      
      // Add click event listener to the button
      button.addEventListener('click', function() {
        // Get the code text
        var code = block.innerText;
        
        // Copy to clipboard
        navigator.clipboard.writeText(code).then(function() {
          // Change button text to indicate success
          button.innerText = 'Copied!';
          button.classList.add('copied');
          
          // Revert button text after 2 seconds
          setTimeout(function() {
            button.innerText = 'Copy';
            button.classList.remove('copied');
          }, 2000);
        }).catch(function(err) {
          console.error('Failed to copy: ', err);
          button.innerText = 'Error';
          setTimeout(function() {
            button.innerText = 'Copy';
          }, 2000);
        });
      });
    });
  };
  
  // Initialize copy buttons
  addCopyButtons();

});