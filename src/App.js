import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Webcam from "react-webcam";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentImage: null,
      tab: 0,
      socket: null,
      currentLatency: 0,
      currentImageStartTime: null,
    };

    // bind methods
    this.boundOnReceive = this.boundOnReceive.bind(this);
    this.sendImage = this.sendImage.bind(this);
  }

  render() {
    return (
      <div className="App">
        <Webcam
          id="cameraView"
          audio={false}
          ref={node => this.webcam = node}
        />


        <div>
        <div> currentLatency: {this.state.currentLatency} </div>
      <h2>Screenshots</h2>
          <div className='screenshots'>
            <div className='controls'>
              <button onClick={this.sendImage}>capture</button>
            </div>
            <canvas id="displayCanvas" width="640" height="480" />
            {/* <div style={{width:"500", height:"500", margin:"20px 60px", border:"1px solid blue"}}>
              <div style={{width:"100%", height:"100%", position:"relative"}}>
                {this.state.displayedImage ? <img id="displayedImage" src={this.state.displayedImage} style={{ position:"absolute", top:"0px", left:"0px"}} /> : null}
                <canvas id="overlayCanvas" style={{ width:"500", height:"500", position:"absolute", top:"0px", left:"0px", "backgroundColor": "rgba(255,0,0,.1)"}}></canvas>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    let socket = new WebSocket(makeWebsocketURL());
    //let socket = new WebSocket("ws://localhost:8765");
    socket.onmessage = this.boundOnReceive;
    this.setState({ socket: socket });
     //socket.onerror = this.boundOnReceive;
     //socket.onclose = this.boundOnReceive;
       //console.log("Socket is closed now.");


  }
// // for setting latency
//   setInterval() {
//     startTime = Date.now()
//     socket.emit('ping');
//   }, 2000);
//
//   socket.on('pong', function(){
//     currentLatency = Date.now() - startTime;
//   }
//
    //TODO: start image sending process


  componentWillUnmount() {

  }

  boundOnReceive(event) {
    // updating currentlatency according to currentImageStartTime
    const currentTime = new Date();
    const currentLatency = this.state.currentImageStartTime - currentTime;

    this.setState({
      currentLatency: currentLatency,
    })

    // get canvas
    let canvas = document.getElementById("displayCanvas");
    let context = canvas.getContext('2d');

    // draw screenshot
    let ssImg = new Image();
    ssImg.onload = function() {
      // add image
      context.drawImage(ssImg, 0, 0, 640, 480);

      // draw boxes
      if (event.data) {
        // extract event data
        let faceData = JSON.parse(event.data);

        for(let i = 0; i < faceData.length; i++){
          let points = faceData[i]["coordinates"];
          // draw image
          context.beginPath();
          context.rect(points[3], points[2], points[2] - points[0], points[3] - points[1]);
          context.lineWidth = 1.5;
          context.strokeStyle = 'red';
          context.stroke();

          // add label
          context.fontSize = "10px";
          context.fillStyle = "red";
          context.fillText(faceData[i]["name"], points[3] + 5, points[2] - 5);
        }
      }
    };
    ssImg.src = this.state.currentImage;

    // send new image immediately
    this.sendImage();

    // after we draw, send a new image in 0.1s
    // setTimeout(function() { this.sendImage(); }.bind(this), 100);
  }

  sendImage() {
    // handle null socket
    if(this.state.socket) {
      let screenshot = this.webcam.getScreenshot();

      // store current image
      this.setState({ currentImage: screenshot },
        // send image to backend in callback after state is updated
        () => {
          this.setState({currentImageStartTime: new Date()});
          this.state.socket.send(screenshot);
          console.log("sent");
        })


    }
  }
}

let makeWebsocketURL = function() {
  let loc = window.location, new_uri;
  if (loc.protocol === "https:") {
      new_uri = "wss:";
  } else {
      new_uri = "ws:";
  }

  let new_host = loc.host.slice(0, loc.host.indexOf(':'));
  // new_host = "localhost"; // TODO: remove this line when not running locally
  new_uri += "//" + new_host + ":8080";
  new_uri += loc.pathname;

  return new_uri;
}

export default App;
