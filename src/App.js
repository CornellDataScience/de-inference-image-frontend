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
      imageWidth: 0,
      imageHeight: 0
    };

    // bind methods
    this.boundOnReceive = this.boundOnReceive.bind(this);
    this.sendImage = this.sendImage.bind(this);
    this.drawWeb = this.drawWeb.bind(this);
    
  }

  render() {
    return (
      <div className="App">
        <Webcam
          id="cameraView"
          audio={false}
          ref={node => this.webcam = node}
        />
        <canvas id="webcamCanvas" height={this.state.imageHeight} width={this.state.imageWidth} style={{width: this.state.imageWidth, height: this.state.imageHeight}} />

        <div>
        <div> currentLatency: {this.state.currentLatency} </div>
      <h2>Screenshots</h2>
          <div className='screenshots'>
            <div className='controls'>
              <button onClick={this.sendImage}>capture</button>
            </div>
            <canvas id="displayCanvas" height={this.state.imageHeight} width={this.state.imageWidth} style={{width: this.state.imageWidth, height: this.state.imageHeight}} />
          </div>
        </div>
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

    // showResults(results){
    //   let context = this.clearOverlay();
    //   this.drawWeb(context,results);
    // }


  drawWeb(event){
    if(event.data){
      // extract event data
      let canvas = document.createElement('webcamCanvas');
      // canvas.width = this.state.imageWidth;
      // canvas.height = this.state.imageHeight;
      let context = this.clearOverlay(canvas);
      let faceData = JSON.parse(event.data);

          // get canvas
          context.drawImage(this.webcam,0,0,this.state.imageWidth,this.state.imageHeight);
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


    }
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

    // this.drawWeb(event);

    this.setState({
      currentLatency: currentLatency,
    });

    if (event.data) {
      // extract event data
      let faceData = JSON.parse(event.data);

      // draw screenshot
      let ssImg = new Image();
      ssImg.onload = function() {
        // set canvas height and width
        this.setState({imageWidth: ssImg.width, imageHeight: ssImg.height}, () => {
          // get canvas
          let canvas = document.getElementById("displayCanvas");
          let context = canvas.getContext('2d');

          // add image
          context.drawImage(ssImg, 0, 0, ssImg.width, ssImg.height);

          // draw boxes
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
          
        });
      }.bind(this);
      ssImg.src = this.state.currentImage;

      // send new image immediately
      this.sendImage();
    }
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
  let loc = window.location;
  let new_uri;
  if (loc.protocol === "https:") {
      new_uri = "wss:";
  } else {
      new_uri = "ws:";
  }

  // for when running locally
  let new_host = loc.host.slice(0, loc.host.indexOf(':'));
  new_uri += "//" + new_host + ":8080";
  new_uri += loc.pathname;

  // for when running in production
  // new_uri += "//" + loc.host;
  // new_uri += loc.pathname;

  return new_uri;
}

export default App;
