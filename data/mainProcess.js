const net = require("net")

var client = new net.Socket();

var activeTitle

var d = new Date()

client.connect(5250, 'localhost', function(){
    document.getElementById('connectionid').style.background = "#39ff92"
})


client.on('data', function(data) {
    console.log(data.toString());
    let dataArr = data.toString().split(/\r\n/)
    dataArr.length -= 2

    //Handle TLS return data
    if (dataArr[0] == "200 TLS OK"){
        dataArr.splice(0,1)
        document.getElementById('container').innerHTML = ""
        document.getElementById("add").addEventListener('click', function(){addTitle("TITLE/MUNICIPAL")}, false)
        for (var i = 0; i < dataArr.length; i++) {
            addTitle(dataArr[i])
        }
    }

    //
})

function refresh() {
    client.connect(5250, 'localhost', function(){
        document.getElementById('connectionid').style.background = "#39ff92"
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
    elem.childNodes[1].placeholder = title
    console.log(getChildNumber(elem)+ 21)
    send("CG 1-" + (getChildNumber(elem) + 21).toString() + " ADD 1 \"" + title + "\" 0 \"{}\"")
    elem.childNodes[3].addEventListener('click',function(event){
        toggleTitle(event.target.parentElement)
    }, false)
}

//Figures out current title and toggles it/replaces it with time for 1s of animation
function toggleTitle(elem) {
    data = {
        "name":document.getElementById('event').value,
        "title":elem.childNodes[1].value,
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
        send("CG 1-" + (titleIndex + 20).toString() + " UPDATE 1 \"" + dataString +"\"")
        send("CG 1-" + (titleIndex + 20).toString() + " PLAY 1")
        // send("CG 1-20 ADD 1 \"" + titleName + "\" 1 \"" + dataString +"\"")
        activeTitle = "trans"
        setTimeout(function(){
            activeTitle = titleIndex
        },1000)
    }else if (activeTitle == titleIndex) {
        console.log("activeTitle == titleIndex")
        send("CG 1-" + (activeTitle + 20).toString() +" STOP 1")
        activeTitle = "trans"
        setTimeout(function(){
            activeTitle = null
        },1000)
        //activeTitle = null
    } else if (activeTitle == "trans"){
        console.log("transitioning")
    } else {
        console.log("else")
        send("CG 1-" + (activeTitle + 20).toString() +" STOP 1")
        activeTitle = "trans"
        setTimeout(function(){
            send("CG 1-" + (titleIndex + 20).toString() + " UPDATE 1 \"" + dataString +"\"")
            send("CG 1-" + (titleIndex + 20).toString() + " PLAY 1")
            setTimeout(function(){
                activeTitle = titleIndex
            },1000)
        },1000)
    }
}

function getChildNumber(node) {
    return Array.prototype.indexOf.call(node.parentNode.childNodes, node);
}

document.addEventListener("DOMContentLoaded", function() {
    send("CG 1 CLEAR")
    send("TLS")
    // document.getElementById('casparlist').addEventListener('click', function(){
    //     var input = document.getElementById('input');
    //     send(input.value)
    // }, false)
});

window.addEventListener('beforeunload', function(){
    send("KILL")
})