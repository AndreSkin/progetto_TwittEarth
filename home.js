$.getScript("Map.js");
$.getScript("Chart.js");
var only_geo = false;
var sent_analyze = false;
var nomedia = false;
var veri = false;
var nocont = false;
var mymap = L.map('map').setView([0, 0], 2);
var SentimetCtx = document.getElementById("SentimentChartID").getContext("2d");
var LocalitiesCtx = document.getElementById("LocalitiesChart").getContext("2d");
var BooksCtx = document.getElementById("BooksChart").getContext("2d");
var BooksCtxTop = document.getElementById("BooksChartTop").getContext("2d");
var PollCtx = document.getElementById("PollChart").getContext("2d");
var SentimentChart = null;
var WordCloud = null;
var bookChart = null;
var bookChartTop = null;
const type = 'doughnut';

//serverUrl = "http://localhost:8000/";
serverUrl = "https://site202136.tw.cs.unibo.it/";

function changebar(choice) {
    return function () {
        function setValues(placeholder1, placeholder2, myfun, toDisable, toSearch, min) {
            document.getElementById('searchbar').setAttribute('placeholder', placeholder1);
            document.getElementById('searchbar').value = "";
            document.getElementById('searchby').setAttribute('placeholder', placeholder2);
            document.getElementById('searchby').value = "";
            document.getElementById('simpleform').setAttribute('action', myfun);
            document.getElementById('searchhead').innerHTML = "Insert" + toSearch;
            document.getElementById('check_sent').disabled = toDisable;
            document.getElementById('check_sent').checked = false;
            document.getElementById('notcontain').disabled = toDisable;
            document.getElementById('notcontain').value = "";
            document.getElementById('containmedia').disabled = toDisable;
            document.getElementById('containmedia').checked = false;
            document.getElementById('verified').disabled = toDisable;
            document.getElementById('verified').checked = false;
            if (toSearch == " location"){
                document.getElementById('plusbutton').disabled = false;
                document.getElementById('minusbutton').disabled = false;
                document.getElementById('numtweets').disabled = false;
                document.getElementById('numtweets').value = min;
                document.getElementById('numtweets').setAttribute('value', min);
                document.getElementById('numtweets').min = "1";
                document.getElementById('numtweets').max = "500";
                document.getElementById('numtweetslabel').innerHTML = "Radius (in miles):";
            }
            else{
                if (toSearch == " contest" || toSearch == " trivia"){
                  document.getElementById('numtweets').disabled = true;
                  document.getElementById('numtweets').value = 0;
                  document.getElementById('plusbutton').disabled = true;
                  document.getElementById('minusbutton').disabled = true;
                } else {
                  document.getElementById('plusbutton').disabled = false;
                  document.getElementById('minusbutton').disabled = false;
                  document.getElementById('numtweets').disabled = false;
                  document.getElementById('numtweets').value = "25";
                  document.getElementById('numtweets').setAttribute('value', "25");
                  document.getElementById('numtweets').min = min;
                  document.getElementById('numtweets').max = "100";
                  document.getElementById('numtweetslabel').innerHTML = "Number:";
              }
            }

        }
        $("#base").empty();
        if (choice == "user") {
            setValues("User name...","User", "javascript:userTimeline()", true, " user name", 5);
        } else if (choice == "text") {
            setValues("Text...","Text", "javascript:textTweet()", false, " text", 10);
        } else if (choice == "hashtag") {
            setValues("Hashtag ...","Hashtag", "javascript:hashtagTweet()", true, " hashtag", 10)
        } else if (choice == "location") {
            setValues("Location ...","Location" ,"javascript:locationTweet()", true, " location", 10);
        } else if(choice == "contest") {
            setValues("Contest ...", "Contest", "javascript:contestTweet()", true, " contest", 0);
        } else if(choice == "trivia") {
          setValues("Trivia ...", "Trivia", "javascript:triviaTweet()", true, " trivia", 0);
        }
    }
}
window.onload = function () {
    BlankMap(mymap);
    only_geo = false;
    sent_analyze = false;
    nomedia = false;
    veri = false;
    nocont  = false;
    document.getElementById('numtweets').value=25;
    document.getElementById('searchbar').value = "";
    var choice_user = document.getElementById('radio_userTimeline');
    var choice_text = document.getElementById('radio_textTweets');
    var choice_hashtag = document.getElementById('radio_hashtagTweets');
    var choice_location = document.getElementById('radio_location');
    var choice_contest = document.getElementById('radio_contest');
    var choice_trivia = document.getElementById('radio_trivia');
    choice_contest.checked = false;
    choice_trivia.checked = false;
    choice_text.checked = false;
    choice_hashtag.checked = false;
    choice_location.checked = false;
    choice_user.checked = true;
    choice_user.addEventListener('click', changebar("user"), false);
    choice_text.addEventListener('click', changebar("text"), false);
    choice_hashtag.addEventListener('click', changebar("hashtag"), false);
    choice_location.addEventListener('click', changebar("location"), false);
    choice_contest.addEventListener('click', changebar("contest"), false);
    choice_trivia.addEventListener('click', changebar("trivia"), false);
    var choice_veri = document.getElementById('verified');
    var choice_geo = document.getElementById('check_geo');
    var choice_sent = document.getElementById('check_sent');
    var choice_media = document.getElementById('containmedia');
    var choice_nocont = document.getElementById('notcontain');
    choice_sent.checked = false;
    choice_sent.disabled = true;
    choice_geo.checked = false;

    function click_geo() {
      only_geo = !only_geo;
      if($("#searchby").attr("placeholder") == "Text")
        choice_sent.disabled = !choice_sent.disabled
      changefilternumber(only_geo)
    }
    function click_sent() {
      sent_analyze = !sent_analyze;
      if($("#searchby").attr("placeholder") == "Text")
        choice_geo.disabled = !choice_geo.disabled
      changefilternumber(sent_analyze)
    }

    function click_nocont() {
      if((choice_nocont.value != "" && !nocont) || (choice_nocont.value == "" && nocont)){
        nocont = !nocont;
        changefilternumber(nocont);
      }
    }

    function changefilternumber(filter){
        var filternumber = parseInt(document.getElementById('input-end').placeholder);
        if (filter) document.getElementById('input-end').setAttribute('placeholder', ++filternumber);
        else document.getElementById('input-end').setAttribute('placeholder', --filternumber);
    }
    choice_geo.addEventListener('change', click_geo, false);
    choice_sent.addEventListener('change', click_sent , false);
    choice_veri.addEventListener('change', () => {veri = !veri; changefilternumber(veri)}, false);
    choice_media.addEventListener('change', () => {nomedia = !nomedia; changefilternumber(nomedia)}, false)
    choice_nocont.addEventListener('input', click_nocont, false)
    //bottoni + e -
    var plusbutton = document.getElementById('plusbutton');
    var minusbutton = document.getElementById('minusbutton');
    var numtweets = document.getElementById('numtweets');

    plusbutton.addEventListener("click", () => { changeval('plus'); })
    minusbutton.addEventListener("click", () => { changeval('minus');})
    numtweets.addEventListener('change', () =>{changeval('equal');})

    function changeval(op){
      var val = parseInt(document.getElementById('numtweets').value)
      var min = document.getElementById('numtweets').min;
      var max = document.getElementById('numtweets').max;
      if (op == 'plus') val++;
      else if (op == 'minus') val--;

      if(val<=max && val>=min){
         document.getElementById('numtweets').setAttribute("value",val);
         document.getElementById('numtweets').value=val;
      }
      else {document.getElementById('numtweets').value=numtweets.getAttribute('value');}
    }
    ///////

}

async function embedTweets(data, user = null, sentiment = false, geo = false) {
    let attr = "tweets";
    let myId = "id";
    let myGeo = "geo";
    if (sentiment)
        attr = "data"
    if (geo) {
        myId = "id_str";
        myGeo = "place";
    }
    MulMapMarkers(mymap, data[attr], user);
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
            await $("#base").append(newT);
        }
    }
}

function contestTweet() {
  ResetMap(mymap);
  ResetChart(SentimentChart);
  ResetChart(WordCloud);
  ResetChart(bookChart);
  ResetChart(bookChartTop);
  $("#base").empty();
  var contest = document.getElementById('searchbar').value;
  contest = contest.replace("#", "~");
  var url = serverUrl + "concorso/" + contest;
  $.ajax({
    type: 'GET',
    url: url,
    crossDomain: true,
    success: function (data) {
      if (data['bando']){
        let labels = []
        let votes = []
        let top = []
        let nowtop = {"part": "", "vote": 0}
        let topnames = []
        let topping = data['results'];
        let index;
        let j = 0;
        for (result of topping){
          labels.push(result['Partecipante']);
          votes.push(result['Voti']);
          if(result['Voti'] > nowtop['vote']){
            nowtop['part'] = result['Partecipante'];
            nowtop['vote'] = result['Voti'];
            index = j;
          }
          j++;
        }
        topping.splice(index, 1);
        top.push(nowtop);
        index = 0;
        for(let i= 0; i < 2; i++){
          j= 0
          nowtop = {"part" : "", "vote": 0}
          for (result of topping){
            if(result['Voti'] > nowtop['vote']){
              nowtop['part'] = result['Partecipante'];
              nowtop['vote'] = result['Voti'];
              index = j
            }
            j++;
          }
          topping.splice(index, 1);
          top.push(nowtop);
        }
        bookChart = new Chart(BooksCtx, InfiniteElementsChartConstructor(votes, labels, "doughnut", "Numero Voti"));
        bookChartTop = new Chart(BooksCtxTop, InfiniteElementsChartConstructor(votes, labels, "bar", "Numero Voti"));
        console.log(top);
      }
    }
  })
}

function userTimeline() {
    ResetMap(mymap);
    ResetChart(SentimentChart);
    ResetChart(WordCloud);
    ResetChart(bookChart);
    ResetChart(bookChartTop);
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
            let TextTermCloud = '';
            for (singleText of data['tweets']){
            TextTermCloud = TextTermCloud + singleText['Text'];
            }
            WordCloud = WordcloudBuilder(TextTermCloud.toLowerCase(), null);
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
    ResetMap(mymap);
    ResetChart(SentimentChart);
    ResetChart(WordCloud);
    ResetChart(bookChart);
    ResetChart(bookChartTop);
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
            let TextTermCloud = '';
            for (singleText of data['data']){
            TextTermCloud = TextTermCloud + singleText['Text'];
            }
            WordCloud = WordcloudBuilder(TextTermCloud.toLowerCase(), null);
        }
    });
}


function textTweet() {
    ResetMap(mymap);
    ResetChart(SentimentChart);
    ResetChart(WordCloud);
    ResetChart(bookChart);
    ResetChart(bookChartTop);
    $("#base").empty();
    var frase = document.getElementById('searchbar').value
    let esclusi = document.getElementById('notcontain').value.replaceAll(" ", "");
    let media = document.getElementById('containmedia').checked;
    let verified = document.getElementById('verified').checked;
    frase = frase.replace("#", "~");
    let numtweets = document.getElementById('numtweets').value;
    var url = serverUrl + "recents/" + frase + "?sentiment=" + sent_analyze + "&notcontain=" + esclusi + "&hasmedia=" + media + "&numtweets=" + numtweets + "&verified=" + verified;
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
                let NeutralWords = data['analysis_data']['Tot_words'] - data['analysis_data']['Tot_pos'] - data['analysis_data']['Tot_neg'];
                let SData = [data['analysis_data']['Tot_neg'], data['analysis_data']['Tot_pos'], NeutralWords];
                SentimentChart = new Chart(SentimetCtx, SentimentChartConstructor(SData, type));
            }
            let TextTermCloud = '';
            for (singleText of data['data']){
            TextTermCloud = TextTermCloud + singleText['Text'];
            }
            WordCloud = WordcloudBuilder(TextTermCloud.toLowerCase(), data['analysis_data']['avg']);
            embedTweets(data, null, true);
            let scripting = `<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"><\/script>`;
            $("#base").append(scripting)
        },
        error: function(err){
          let newT = $("<div>");
          let txt = $("<p>");
          txt.text("Error: " + "Ricerca Errata");
          newT.append(txt);
          $("#base").append(newT);
          $("#base").append("<br>");
        }
    });
}

function locationTweet() {
    ResetMap(mymap);
    ResetChart(SentimentChart);
    ResetChart(WordCloud);
    ResetChart(bookChart);
    ResetChart(bookChartTop);
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
                    let TextTermCloud = '';
                    for (singleText of data['statuses']){
                    TextTermCloud = TextTermCloud + singleText['Text'];
                    }
                    WordCloud = WordcloudBuilder(TextTermCloud.toLowerCase(), null);
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
