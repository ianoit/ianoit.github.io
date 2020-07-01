$(window).scroll(function() {
    /* Return To Top */
    if ($(this).scrollTop() >= 50) {        // If page is scrolled more than 50px
        $('#return-to-top').fadeIn(200);    // Fade in the arrow
    } else {
        $('#return-to-top').fadeOut(200);   // Else fade out the arrow
    }

    /* Sticky Navbar */
    if ( window.scrollY > 100 ) {
        document.body.classList.add('scrolled')
    } else {
        document.body.classList.remove('scrolled')
    }
});

// Return to Top Click
$('#return-to-top').click(function() {      // When arrow is clicked
    $('body,html').animate({
        scrollTop : 0                       // Scroll to top of body
    }, 500);
});