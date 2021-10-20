var settings = {
  "url": "https://api.twitter.com/2/users//tweets",
  "method": "GET",
  "timeout": 0,
};

function onStart(){
  $.ajax(settings).done(function (response) {
  console.log(response);
  });
}
