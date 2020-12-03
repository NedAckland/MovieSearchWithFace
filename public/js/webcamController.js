(function () {
    var width = 320;
    var height = 0;
    var streaming = false;
    var video = null;
    var canvas = null;
    var photo = null;
    var startbutton = null;

    function startup() {
        video = document.getElementById('video');
        canvas = document.getElementById('canvas');
        photo = document.getElementById('photo');
        startbutton = document.getElementById('emotion-btn');

        navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function (stream) {
            video.srcObject = stream;
            video.play();
        }).catch(function (err) {
            console.log("An error occurred: " + err);
        });

        video.addEventListener('canplay', function (ev) {
            if (! streaming) {
                height = video.videoHeight / (video.videoWidth / width);
                if (isNaN(height)) {
                    height = width / (4 / 3);
                }
                video.setAttribute('width', width);
                video.setAttribute('height', height);
                canvas.setAttribute('width', width);
                canvas.setAttribute('height', height);
                streaming = true;
            }
        }, false);

        startbutton.addEventListener('click', function (ev) {
            takepicture();
            ev.preventDefault();
        }, false);

        clearphoto();
    }


    function clearphoto() {
        var context = canvas.getContext('2d');
        context.fillStyle = "#AAA";
        context.fillRect(0, 0, canvas.width, canvas.height);

        var data = canvas.toDataURL('image/png');
        photo.setAttribute('src', data);

    }

    async function takepicture() {
        var context = canvas.getContext('2d');
        if (width && height) {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);
            var data = canvas.toDataURL('image/png');
            photo.setAttribute('src', data);
            const loader = document.querySelector('#loader')
            loader.classList.add('loader')

            axios.post('/image', {image: data}).then(res => {
                var detectedEmotions = convertToObject(res.data.data)
                var emotion = getHighestScore(detectedEmotions)
                createHTMLElement("top-emotion", "h2", emotion)
                getEmotions(detectedEmotions)
                chooseMovie(emotion, res.data.apiKey)
            })

        } else {
            clearphoto();
        }
    }
    window.addEventListener('load', startup, false);
})();

function getEmotions(res) {
    document.querySelector('.emotion-output ').innerHTML = ""
    const loader = document.querySelector('#loader')
    loader.classList.remove('loader')
    for (let item in res) {
        var node = document.createElement("LI");
        var textnode = document.createTextNode(`${item}: ${
            (res[item] * 100).toFixed(0)
        }%`);
        node.appendChild(textnode);
        document.querySelector('.emotion-output ').appendChild(node)
    }
}

function createHTMLElement(varClass, nodeType, content) {
    document.querySelector(`.${varClass}`).innerHTML = ""
    var node = document.createElement(nodeType);
    var textnode = document.createTextNode(`${content}`);
    node.appendChild(textnode);
    document.querySelector(`.${varClass}`).appendChild(node)
}

function convertToObject(string) {
    var properties = string.split(', ');
    var obj = {};
    properties.forEach(function (property) {
        var tup = property.split(':');
        obj[tup[0]] = tup[1]
    });
    return obj
}
function getHighestScore(faceDetails) {
    const target = 1
    let closest = 500
    let key = ""
    for (i in faceDetails) {
        let dist = Math.abs(target - faceDetails[i])
        if (dist < closest) {
            closest = dist;
            key = i
            value = faceDetails[i]
        }
    }
    return key

}

function getTMDBConfig(key) {
    axios.get(`https://api.themoviedb.org/3/configuration?api_key=${key}`, {}).then(res => {
        sessionStorage.setItem("configUrl", res.data.images.base_url)
    })
}


function chooseMovie(query, apiKey) {
    let moviesApi = "https://api.themoviedb.org/3/search/movie"
    axios.get(`${moviesApi}?api_key=${apiKey}&language=en-US&query=${query}&include_adult=true&page=1`, {}).then(res => {
        getTMDBConfig(apiKey)
        addPageContent(res)
    })
}
// chooseMovie("happyness")

function addPageContent(res) {
    console.log(res.data.results[0])
    createHTMLElement('movie-title', 'h1', res.data.results[0].original_title)
    createHTMLElement('overview', 'p', res.data.results[0].overview)
    poster.innerHTML = ""
    node = document.createElement("img")
    node.setAttribute('src', `${
        sessionStorage.getItem("configUrl")
    }/w185${
        res.data.results[0].poster_path
    }`)
    poster.appendChild(node)

}



const poster = document.querySelector('.poster')


