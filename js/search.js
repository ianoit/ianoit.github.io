// define globale variables
var idx, searchInput, searchResults = null;
var documents = [];

function postDate(date) {
    const options1 = { year: 'numeric', month: 'long', day: 'numeric' };
    const date1 = new Date(date);

    const dateTimeFormat = new Intl.DateTimeFormat(['ban', 'id'], options1);

    return dateTimeFormat.format(date1);
}

function renderSearchResults(searchInput, results){

    if (results.length > 0) {

        // create pagination
        var url_string = window.location.href;
        var url = new URL(url_string);

        var page = url.searchParams.get("page") ? parseInt(url.searchParams.get("page")) : 1;
        var limit = 6;
        var start = (page > 1) ? (page * limit) - limit : 0;
        var end = page * limit;
        var total = results.length;
        var pages = Math.ceil(total / limit);

        // slice results
        results = results.slice(start, end);

        // create variable for result item
        var article = "";

        // append results
        results.forEach(result => {

            article += `<article class="ui-post entry col-md-4 card-container">
                            <meta itemprop="mainEntityOfPage" content="${result.ref}">
                            <div class="entry card h-100">
                                <div class="card-header-image">
                                    <a href="${result.ref}" class="">
                                        <img src="${documents[result.ref].image}">
                                    </a>
                                </div>
                                <div class="card-inside">
                                    <h2 class="heading">
                                        <a href="${result.ref}" class="heading">${documents[result.ref].title}</a>
                                    </h2>
                                    <p>${documents[result.ref].content.substr(0, 75)} ...</p>
                                </div>
                                <div class="meta-bottom mt-auto">
                                    <div class="avatar">
                                        <div class="d-flex">
                                            <a class="profile-avatar">
                                                <img src="${documents[result.ref].avatar}" alt="${documents[result.ref].author}" class="avatar-image">
                                            </a>
                                            <div>
                                                <span class="username">${documents[result.ref].author}</span> &nbsp;
                                            </div>
                                        </div>
                                        <div class="date">
                                            <time pubdate="" itemprop="datePublished">
                                                ${postDate(documents[result.ref].date.substr(0, 10))} &middot; dibaca normal ${documents[result.ref].readingtime} menit
                                            </time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>`;
        });

        // show results
        searchResults.innerHTML = article;

        // show pagination
        if(results.length > limit) {
            var pagination = "";
            pagination += `<li class="page-item">
                                <a class="page-link" href="?q=` + url.searchParams.get("q") + `" aria-label="First"><span aria-hidden="true">Pertama</span></a>
                            </li>`;
            pagination += `<li class="page-item`
                            if(page == 1) {
                                pagination += ` disabled`
                            }
            pagination += `">
                            <a class="page-link" href="?q=` + url.searchParams.get("q") + `&page=` + (page - 1) + `" aria-label="Sebelumnya"><span aria-hidden="true">Sebelumnya</span></a>
                        </li>`;
            
            var ends_count = 2;  //how many items at the ends (before and after [...])
            var middle_count = 1;  //how many items before and after current page
            var dots = false;

            for(var i = 1; i <= pages; i++) {
                
                if (i <= ends_count || (page && i >= page - middle_count && i <= page + middle_count) || i > pages - ends_count) {
                    pagination += `<li class="page-item`;
                    if(page == i) {
                        pagination += ` active`;
                    }
                    pagination += `">
                                    <a class="page-link" href="?q=` + url.searchParams.get("q") + `&page=` + i + `">` + i + `</a>
                                </li>`;

                    dots = true;
                } else if (dots) {
                    pagination += `<li class="page-item disabled">
                                        <a class="page-link"><span>&hellip;</span></a>
                                    </li>`;

                    dots = false;
                }

            }

            pagination += `<li class="page-item`
                            if(page == pages) {
                                pagination += ` disabled`
                            }
            pagination += `">
                                <a class="page-link" href="?q=` + url.searchParams.get("q") + `&page=` + (page + 1) + `" aria-label="Selanjutnya"><span aria-hidden="true">Selanjutnya</span></a>
                            </li>`;
            pagination += `<li class="page-item">
                                <a class="page-link" href="?q=` + url.searchParams.get("q") + `&page=` + pages + `" aria-label="Akhir"><span aria-hidden="true">Akhir</span></a>
                            </li>`;
            document.getElementById("pagination").innerHTML = pagination;
        }

    // if results are empty
    } else {
        searchResults.innerHTML = `<center>
                                    <img src="../img/404.webp" class="img-responsive" width="40%"><br>
                                    <span style="font-weight: lighter; font-size: 3em;">
                                        <b>Pencarian "` + searchInput.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;") + `"</b> tidak ditemukan
                                    </span>
                                </center>`;
    }
}

function registerSearchHandler() {
    var url_string = window.location.href;
    var url = new URL(url_string);
    var q = url.searchParams.get("q");

    // remove search results if the user empties the search input field
    if (q) {
        // get input value
        var query = q;

        // run fuzzy search
        var results = idx.search(query + '*');

        // render results
        renderSearchResults(q, results);

        searchInput.value = q;
        document.getElementById('keyword').innerHTML = q.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
        document.getElementsByTagName('title')[0].innerHTML = 'Hasil Pencarian : ' + q.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
            
    } else {

        searchResults.innerHTML = `<center>
                                        <img src="/img/search.webp" class="img-responsive" width="40%">
                                    </center>`;
    
    }
}

window.onload = function() {

    // get dom elements
    searchInput = document.getElementById('search-input');
    searchResults = document.getElementById('search-results');

    // request and index documents
    fetch('/blog/index.json', {
        method: 'get'
    }).then(
        res => res.json()
    ).then(
    res => {

        // index document
        idx = lunr(function() {
            this.ref('url')
            this.field('title')
            this.field('content')
            this.field('image')
            this.field('author')
            this.field('avatar')
            this.field('date')
            this.field('readingtime')

            res.forEach(function(doc) {
                this.add(doc)
                documents[doc.url] = {
                    'title': doc.title,
                    'content': doc.content,
                    'image': doc.image,
                    'author': doc.author,
                    'avatar': doc.avatar,
                    'date': doc.date,
                    'readingtime': doc.readingtime
                }
            }, this)
        });

        // data is loaded, next register handler
        registerSearchHandler();
        
    }
    ).catch(
        err => {
            searchResults.innerHTML = `<p>${err}</p>`
        }
    )
}