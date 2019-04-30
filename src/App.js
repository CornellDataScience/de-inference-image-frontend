import React, { Component } from 'react';
import './App.css';
import Webcam from "react-webcam";

const PRODUCTION_MODE = process.env.NODE_ENV && process.env.NODE_ENV !== 'development';
console.log("in production? " + PRODUCTION_MODE)

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentImage: null,
      tab: 0,
      socket: null,
      currentLatency: 0,
      currentImageStartTime: null,
      imageWidth: 640,
      imageHeight: 480,
      imageSizeSet: false,
      started: false
    };

    // bind methods
    this.boundOnReceive = this.boundOnReceive.bind(this);
    this.sendImage = this.sendImage.bind(this);
    this.startStream = this.startStream.bind(this);
  }

  render() {
    return (
      <div className="App">
        <div id="overlayDiv" height={this.state.imageHeight} width={this.state.imageWidth} >
          <Webcam
            id="cameraView"
            audio={false}
            ref={node => this.webcam = node}
            width={this.state.imageWidth}
            height={this.state.imageHeight}
          />
          
          <span id="overlaySpan">
            <canvas id="webcamCanvas" height={this.state.imageHeight} width={this.state.imageWidth} 
              style={{width: this.state.imageWidth, height: this.state.imageHeight}} />
          </span>
        </div>

          <h1> Current Latency: {this.state.currentLatency} </h1>

          <button onClick={this.startStream} disabled={this.started} >Capture</button>

      </div>
    );
  }

  clearOverlay(canvas) {
      let context = canvas.getContext('2d');
      context.clearRect(0, 0, this.state.imageWidth, this.state.imageHeight);
      context.strokeStyle = '#ff0000';
      context.lineWidth = 5;
      return context;
    }

  componentDidMount() {
    let socket = new WebSocket(makeWebsocketURL());
    socket.onmessage = this.boundOnReceive;
    this.setState({ socket: socket });
    //socket.onerror = this.boundOnReceive;
    //socket.onclose = this.boundOnReceive;
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


  componentWillUnmount() {
    //TODO: low priority - close connection
  }

  boundOnReceive(event) {
    // updating currentlatency according to currentImageStartTime
    const currentTime = new Date();
    const currentLatency = currentTime - this.state.currentImageStartTime;

    this.setState({currentLatency: currentLatency});

    if (event.data) {
      // unpack event data
      let unpacked = JSON.parse(event.data);

      // extract event data
      let faceData = unpacked.faces;

      // draw over video
      let canvas = document.getElementById('webcamCanvas');
      let context = this.clearOverlay(canvas);

      // get canvas
      // context.drawImage(this.webcam,0,0,this.state.imageWidth,this.state.imageHeight);
      // draw boxes
      for(let i = 0; i < faceData.length; i++){
        let points = faceData[i]["coordinates"];
        // draw image
        context.beginPath();
        context.rect(points[3], points[2], points[2] - points[0], points[3] - points[1]);
        context.lineWidth = 1.5;

        context.strokeStyle = "red";
        context.stroke();

        // add label
        context.fontSize = "10px";
        context.fillStyle = "red";
        context.fillText(faceData[i]["name"], points[3] + 5, points[2] - 5);
      }

      // send next image
      this.sendImage();
    }
  }

  sendImage() {
    // handle null socket
    if(this.state.socket) {
      let screenshot = this.webcam.getScreenshot();
      let toSend = { timestamp: new Date(), screenshot: screenshot };

      // store current image
      this.setState({currentImageStartTime: new Date()});
      
      if(!this.state.imageSizeSet){
        console.log("getting image size for first time");

        let ssImg = new Image();
        ssImg.onload = function() {
          // set canvas height and width
          this.setState({imageWidth: ssImg.width, imageHeight: ssImg.height, imageSizeSet: true}, () => {
            console.log("special first run send");
            this.state.socket.send(JSON.stringify(toSend));
          });
        }.bind(this);
        ssImg.src = screenshot;
      } else {
        console.log("normal send");
        this.state.socket.send(JSON.stringify(toSend));
      }
    }
  }

  startStream() {
    if (!this.state.started) {
      console.log("starting stream");
      this.setState({ started: true }, () => {
        // this.interval = setInterval(() => this.sendImage(), 450);
        this.sendImage();
      })
    }
  }
}

let makeWebsocketURL = function() {
  let loc = window.location;
  let new_uri;
  if (loc.protocol === "https:") {
      new_uri = "wss:";
  } else {
      new_uri = "ws:";
  }

  if (PRODUCTION_MODE) {
    new_uri += "//" + loc.host;
    new_uri += loc.pathname;
  } else {
    new_uri = "wss://localhost:8080"
  }
  
  return new_uri;
}

export default App;
