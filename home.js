var only_geo = false;
var sent_analyze = false;
var mymap = L.map('map').setView([0, 0], 1);

//serverUrl = "http://localhost:8000/";
serverUrl = "https://site202136.tw.cs.unibo.it/";

function changebar(choice) {
    return function () {
        function setValues(placeholder, myfun, toDisable, toSearch, min) {
            document.getElementById('searchbar').setAttribute('placeholder', placeholder);
            document.getElementById('searchbar').value = "";
            document.getElementById('simpleform').setAttribute('action', myfun);
            document.getElementById('searchhead').innerHTML = "Inserisci " + toSearch + " da cercare";
            document.getElementById('check_sent').disabled = toDisable;
            document.getElementById('check_sent').checked = false;
            document.getElementById('notcontain').disabled = toDisable;
            document.getElementById('notcontain').value = "";
            document.getElementById('containmedia').disabled = toDisable;
            document.getElementById('containmedia').checked = false;
            if (toSearch == "il luogo"){
                document.getElementById('numtweets').value = min;
                document.getElementById('numtweets').min = "1";
                document.getElementById('numtweets').max = "500";
                document.getElementById('numtweetslabel').innerHTML = "Raggio di ricerca (in miglia):";
            }
            else{
                document.getElementById('numtweets').value = "25";
                document.getElementById('numtweets').min = min;
                document.getElementById('numtweets').max = "100";
                document.getElementById('numtweetslabel').innerHTML = "Numero di tweet:";
            }

        }
        $("#base").empty();
        if (choice == "user") {
            setValues("Nome Utente ...", "javascript:userTimeline()", true, "il nome utente", 5);
        } else if (choice == "text") {
            setValues("Testo ...", "javascript:textTweet()", false, "il testo", 10);
        } else if (choice == "hashtag") {
            setValues("Hashtag ...", "javascript:hashtagTweet()", true, "l'hashtag", 10)
        } else if (choice == "location") {
            setValues("Località ...", "javascript:locationTweet()", true, "il luogo", 10);
        }
    }
}
window.onload = function () {
    BlankMap(mymap);
    only_geo = false;
    sent_analyze = false;
    var choice_user = document.getElementById('radio_userTimeline');
    var choice_text = document.getElementById('radio_textTweets');
    var choice_hashtag = document.getElementById('radio_hashtagTweets');
    var choice_location = document.getElementById('radio_location');
    choice_text.checked = false;
    choice_hashtag.checked = false;
    choice_location.checked = false;
    choice_user.checked = true;
    choice_user.addEventListener('click', changebar("user"), false);
    choice_text.addEventListener('click', changebar("text"), false);
    choice_hashtag.addEventListener('click', changebar("hashtag"), false);
    choice_location.addEventListener('click', changebar("location"), false);
    var choice_geo = document.getElementById('check_geo');
    var choice_sent = document.getElementById('check_sent');
    choice_sent.checked = false;
    choice_sent.disabled = true;
    choice_geo.checked = false;
    choice_geo.addEventListener('click', () => { only_geo = !only_geo; }, false);
    choice_sent.addEventListener('click', () => { sent_analyze = !sent_analyze }, false)
}

function embedTweets(data, user = null, sentiment = false, geo = false) {
    let attr = "tweets";
    let myId = "id";
    let myGeo = "geo";
    if (sentiment)
        attr = "data"
    if (geo) {
        myId = "id_str";
        myGeo = "place";
    }
    MulMapMarkers(data[attr], user);
    for (let tweet of data[attr]) {
        if ((tweet[myGeo] == null && !only_geo) || (tweet[myGeo] != null)) {
            let embed = $("<blockquote>");
            embed.addClass('twitter-tweet');
            embed.addClass('ourTweets');
            let atweet = $("<a>");
            let myurl = "https://twitter.com/tweet/status/" + tweet[myId];
            atweet.attr('href', myurl);
            embed.append(atweet);
            let newT = $("<div>");
            newT.addClass("tweet");
            newT.append(embed);
            if (sentiment) {
                if (data['analysis_data']['avg'] != null) {
                    let newSent = $('<div>')
                    newSent.addClass('sentiment');
                    let p = $("<p>");
                    p.text("Score: " + tweet['sentiment']['eval'][0]['Score']);
                    newSent.append(p);
                    p = $("<p>");
                    p.text("Numero di parole positive: " + tweet['sentiment']['eval'][0]['PosL']);
                    newSent.append(p);
                    let t = ""
                    for (let pos of tweet['sentiment']['eval'][0]['Pos']) {
                        t += pos + ", "
                    }
                    p = $("<p>");
                    p.text("Parole positive: " + t);
                    newSent.append(p);
                    p = $("<p>");
                    p.text("Numero di parole negative: " + tweet['sentiment']['eval'][0]['NegL']);
                    newSent.append(p);
                    let tn = ""
                    for (let pos of tweet['sentiment']['eval'][0]['Neg']) {
                        tn += pos + ", "
                    }
                    p = $("<p>");
                    p.text("Parole negative: " + tn);
                    newSent.append(p);
                    newT.append(newSent);
                }
            }
            $("#base").append(newT);
        }
    }
}

function userTimeline() {
    $("#base").empty();
    var user = document.getElementById('searchbar').value;
    if (user[0] == '@') {
        user = user.substring(1);
    }
    let numtweets = document.getElementById('numtweets').value;
    var url = serverUrl + "users/" + user + "?numtweets=" + numtweets;
    $.ajax({
        type: 'GET',
        url: url,
        crossDomain: true,
        success: function (data) {
            if (data['tweets']) {
                embedTweets(data, user);
            }
            else {
                let newT = $('<div>');
                let p = $('<p>');
                p.text("Utente non trovato");
                newT.append(p);
                $('#base').append('<br>');
                $('#base').append(newT);
            }
            let scripting = `<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"><\/script>`;
            $("#base").append(scripting)
        },
        error: function (err) {
            let newT = $("<div>");
            let txt = $("<p>");
            txt.text("Error: " + "Utente non trovato");
            newT.append(txt);
            $("#base").append(newT);
            $("#base").append("<br>");
        }
    });
}


function hashtagTweet() {
    $("#base").empty();
    var tag = document.getElementById('searchbar').value;
    let err = new Boolean(false);
    if (tag.includes(' ')) {
        err = true;
    }
    if (tag[0] != '#') {
        tag = "#" + tag;
    }
    let numtweets = document.getElementById('numtweets').value;
    var url = serverUrl + "recents/" + tag.replace("#", "~") + "?numtweets=" + numtweets;

    if (err == true) {
        let newT = $('<div>');
        newT.text(" Non un Hashtag");
        $("#base").append(newT);
        return;
    }

    $.ajax({
        type: 'GET',
        url: url,
        crossDomain: true,
        success: function (data) {
            embedTweets(data, null, true);
            let scripting = `<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"><\/script>`;
            $("#base").append(scripting)
        }
    });
}


function textTweet() {
    $("#base").empty();
    var frase = document.getElementById('searchbar').value
    let esclusi = document.getElementById('notcontain').value.replaceAll(" ", "");
    let media = document.getElementById('containmedia').checked;
    frase = frase.replace("#", "~");
    let numtweets = document.getElementById('numtweets').value;
    var url = serverUrl + "recents/" + frase + "?sentiment=" + sent_analyze + "&notcontain=" + esclusi + "&hasmedia=" + media + "&numtweets=" + numtweets;
    $.ajax({
        type: 'GET',
        url: url,
        crossDomain: true,
        success: function (data) {
            if (data['analysis_data']['avg'] != null) {
                let newS = $('<div>');
                let p = $('<p>');
                p.text("Il sentimento per questa stringa è: " + data['analysis_data']['avg']);
                newS.append(p);
                p = $('<p>');
                p.text("Le parole totali analizzate sono: " + data['analysis_data']['Tot_words']);
                newS.append(p);
                p = $('<p>');
                p.text("Le parole positive totali sono: " + data['analysis_data']['Tot_pos']);
                newS.append(p);
                p = $('<p>');
                p.text("Le parole negative totali sono: " + data['analysis_data']['Tot_neg']);
                newS.append(p);
                $('#base').append('<br>');
                $("#base").append(newS);
                $('#base').append('<br>');
            }
            embedTweets(data, null, true);
            let scripting = `<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"><\/script>`;
            $("#base").append(scripting)
        }
    });
}

function locationTweet() {
    $("#base").empty();
    var location = document.getElementById('searchbar').value
    let radius = document.getElementById('numtweets').value;
    $.ajax({
        type: 'GET',
        url: 'https://nominatim.openstreetmap.org/search?format=json&q=%27' + location,
        crossDomain: true,
        success: function (data) {
            var url = serverUrl + "geo/" + data[0]['lat'] + "x" + data[0]['lon'] + "?radius=" + radius;
            $.ajax({
                type: 'GET',
                url: url,
                crossDomain: true,
                success: function (data) {
                    embedTweets(data, null, false, true);
                    let scripting = `<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"><\/script>`;
                    $("#base").append(scripting)
                },
                error: function (err) {
                    let newT = $("<div>");
                    let txt = $("<p>");
                    txt.text("Error: " + err.responseJSON.message);
                    newT.append(txt);
                    $("#base").append(newT);
                    $("#base").append("<br>");
                }
            });
        }
    });
}

//Mappa
//Costruisce una mappa vuota
function BlankMap(mymap) {
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        minZoom: 1,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(mymap);
}

function MulMapMarkers(TweetsList, User = null) {
    let MarkerGroup = [];
    //Elimina tutti i marker
    mymap.eachLayer(function (layer) {
        if (!!layer.toGeoJSON) {
            mymap.removeLayer(layer);
        }
    })
    //Crea dei marker per ogni coordinata fornita
    for (let i = 0; i < TweetsList.length; i = i + 1) {
        if (TweetsList[i]['geo'] != null) {
            let tmp;
            if (User != null) {
                tmp = User
            }
            else tmp = TweetsList[i]['Author'];
            L.marker([TweetsList[i]['geo']['coord_center'][1], TweetsList[i]['geo']['coord_center'][0]]).addTo(mymap).bindPopup("<b>" + tmp + "</b>" + ": <br/>" + TweetsList[i]['Text']);
            MarkerGroup.push(L.marker([TweetsList[i]['geo']['coord_center'][1], TweetsList[i]['geo']['coord_center'][0]]))
        }
    }
    let group = new L.featureGroup(MarkerGroup);
    if (MarkerGroup.length != 0) mymap.fitBounds(group.getBounds());
}
