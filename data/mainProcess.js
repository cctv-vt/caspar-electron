const net = require("net")
const remote = require("electron").remote
const fs = require('fs')


var settings = JSON.parse(fs.readFileSync('settings.json'))

var client = new net.Socket()

var activeTitle

var d = new Date()

//Uses alternate method of displaying titles in casparcg
//makes the addTitle function assign toggleTitleLightweight() instead of toggle
const performanceMode = settings.client.lowPower
const serverIp = settings.server.address;

// io.on('keydown', event => {
//     console.log(event); // { type: 'mousemove', x: 700, y: 400 }
//   });
  

// io.start()


client.on('connect', () => {
    document.getElementById('connectionid').style.background = "#39ff92"
    send("TLS")
})

client.on('close', () => {
    setTimeout(() => {
        client.connect(5250, serverIp)
    },1000)
})

client.connect(5250, serverIp)

client.on('data', function(data) {
    console.log("recieved from casparcg: " + data.toString());
    let dataArr = data.toString().split(/\r\n/)
    dataArr.length -= 2

    //Handle TLS return data
    if (dataArr[0] == "200 TLS OK"){
        dataArr.splice(0,1)
        document.getElementById('titlesContainer').innerHTML = ""
        for (var i = 0; i < dataArr.length; i++) {
            //addTitle(dataArr[i])
            addTitleLibrary(dataArr[i])
        }
    }

    //
})

function refresh() {
    client.connect(5250, 'localhost', () => {
        document.getElementById('connectionid').style.background = "#39ff92"
    })
}

function addTitleLibrary(title) {
    console.log(title + ' added to library')
    var elem = document.createElement('div')
    elem.classList.add("titleLibraryButton")
    elem.dataset.title = title
    document.getElementById('titlesContainer').appendChild(elem)
    elem.innerHTML = document.getElementById('libraryTemplate').innerHTML
    elem.childNodes[1].textContent = title
    elem.querySelector('.addButton').addEventListener('click', () => {
        addTitle(title)
    })
}

function send(msg) {
    client.write(msg + "\r\n")
}

function addTitle(title) {
    var elem = document.createElement('div')
    elem.classList.add("titleButton")
    elem.dataset.title = title
    document.getElementById('container').appendChild(elem)
    elem.innerHTML = document.getElementById('buttonTemplate').innerHTML
    elem.querySelector('.titleInput').placeholder = title
    elem.draggable = 'true'
    if (performanceMode) {
        elem.querySelector('.liveButton').addEventListener('click', (event) => {
            toggleTitleLightweight(event.target.parentElement)
        }, false)
    } else {
        send("CG 1-" + (getChildNumber(elem) + 21).toString() + " ADD 1 \"" + title + "\" 0 \"{}\"")
        elem.querySelector('.liveButton').addEventListener('click', (event) => {
            toggleTitle(event.target.parentElement)
        }, false)
    }

}

//Figures out current title and toggles it/replaces it with time for 1s of animation
function toggleTitle(elem) {
    data = {
        "name":document.getElementById('event').value,
        "title":elem.childNodes[1].value,
        "date": d.getMonth().toString() + "/" + d.getDate().toString() + "/" + d.getFullYear().toString()
    }
    dataString = JSON.stringify(data).replace(/\"/g,"\\\"")
    var titleName = elem.dataset.title
    var titleIndex = getChildNumber(elem) + 1
    if (!activeTitle) {
        console.log("!activeTitle")
        //UPDATE AND PLAY TITLE
        send("CG 1-" + (titleIndex + 20).toString() + " UPDATE 1 \"" + dataString +"\"")
        send("CG 1-" + (titleIndex + 20).toString() + " PLAY 1")
        // send("CG 1-20 ADD 1 \"" + titleName + "\" 1 \"" + dataString +"\"")
        activeTitle = "trans"
        setTimeout( () => {
            activeTitle = titleIndex
        },1000)
    }else if (activeTitle == titleIndex) {
        console.log("activeTitle == titleIndex")
        send("CG 1-" + (activeTitle + 20).toString() +" STOP 1")
        activeTitle = "trans"
        setTimeout( () => {
            activeTitle = null
        },1000)
        //activeTitle = null
    } else if (activeTitle == "trans"){
        console.log("transitioning")
    } else {
        console.log("else")
        send("CG 1-" + (activeTitle + 20).toString() +" STOP 1")
        activeTitle = "trans"
        setTimeout( () => {
            send("CG 1-" + (titleIndex + 20).toString() + " UPDATE 1 \"" + dataString +"\"")
            send("CG 1-" + (titleIndex + 20).toString() + " PLAY 1")
            setTimeout( () => {
                activeTitle = titleIndex
            },1000)
        },1000)
    }

}

function toggleTitleLightweight(elem) {
    //A version of the toggle title command that is better for less powerful systems
    data = {
        "name":document.getElementById('event').value,
        "title":elem.querySelector('.titleInput').value,
        "date": d.getMonth().toString() + "/" + d.getDate().toString() + "/" + d.getFullYear().toString()
    }
    dataString = JSON.stringify(data).replace(/\"/g,"\\\"")
    console.log(getChildNumber(elem))
    var titleName = elem.dataset.title
    var titleIndex = getChildNumber(elem) + 1
    console.log(titleIndex)
    if (!activeTitle) {
        console.log("!activeTitle")
        //UPDATE AND PLAY TITLE
        send("CG 1-20 ADD 1 \"" + titleName + "\" 1 \"" + dataString +"\"")
        activeTitle = "trans"
        setTimeout( () => {
            activeTitle = titleIndex
        },1000)
    }else if (activeTitle == titleIndex) {
        console.log("activeTitle == titleIndex")
        send("CG 1-20 STOP 1")
        activeTitle = "trans"
        setTimeout( () => {
            activeTitle = null
        },1000)
        //activeTitle = null
    } else if (activeTitle == "trans"){
        console.log("transitioning")
    } else {
        console.log("else")
        send("CG 1-20 STOP 1")
        activeTitle = "trans"
        setTimeout( () => {
            send("CG 1-20 ADD 1 \"" + titleName + "\" 1 \"" + dataString +"\"")
            setTimeout( () => {
                activeTitle = titleIndex
            },1000)
        },1000)
    }
    
}

function indicateLive() {
    var liveButtons = document.getElementsByClassName('liveButton')
    for (var i = 0; i < liveButtons.length; i++) {
        document.getElementById("container").childNodes[activeTitle - 1].querySelector('.liveButton').style.background = "#111"
    }
    if (activeTitle == 'trans') {
        for (var i = 0; i < liveButtons.length; i++) {
            document.getElementById("container").childNodes[activeTitle - 1].querySelector('.liveButton').style.background = "#154"
        }
    } else {
        document.getElementById("container").childNodes[activeTitle - 1].querySelector('.liveButton').style.background = "#124"
    }

}

function getChildNumber(node) {
    return Array.prototype.indexOf.call(node.parentNode.childNodes, node);
}

document.addEventListener("DOMContentLoaded", () => {
    send("TLS")
    document.getElementById('connectionid').addEventListener('click', () => {
        send('TLS')
    })
    // document.getElementById("add").addEventListener('click', () => {
    //     addTitle("TITLE/MUNICIPAL")
    // }, false)
    // document.getElementById('casparlist').addEventListener('click', function(){
    //     var input = document.getElementById('input');
    //     send(input.value)
    // }, false)
});

window.addEventListener('unload', () => {
    if(settings.server.autolaunch) {
        send("KILL")
    }
})

