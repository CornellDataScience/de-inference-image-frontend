import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Webcam from "react-webcam";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      displayedImage: null,
      tab: 0,
      socket: null,
    };
  }
  
  sendImage = () => {
    // handle null socket
    if(this.state.socket) {
      let screenshot = this.webcam.getScreenshot();

      // send image to backend
      this.state.socket.send(screenshot);

      // draw image on canvas
      this.setState({ displayedImage: screenshot });
    }
  }

  render() {
    return (
      <div className="App"> 
        <Webcam
          audio={false}
          ref={node => this.webcam = node}
        />
        <div>
          <h2>Screenshots</h2>
          <div className='screenshots'>
            <div className='controls'>
              <button onClick={this.sendImage}>capture</button>
            </div>

            <div style={{width:"500", height:"500", margin:"20px 60px", border:"1px solid blue"}}>
              <div style={{width:"100%", height:"100%", position:"relative"}}>
                {this.state.displayedImage ? <img id="displayedImage" src={this.state.displayedImage} style={{ position:"absolute", top:"0px", left:"0px"}} /> : null}
                <canvas id="overlayCanvas" style={{ width:"500", height:"500", position:"absolute", top:"0px", left:"0px", "backgroundColor": "rgba(255,0,0,.1)"}}></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    // let socket = new WebSocket(makeWebsocketURL());
    let socket = new WebSocket("ws://localhost:8765");
    this.setState({ socket: socket }, (() => this.state.socket.onmessage = boundOnReceive).bind(this));
  }

  componentWillUnmount() {
    
  }
}

let boundOnReceive = (function (event) {
  // TODO: draw box
  console.log(event.data)
  if (event.data.name) {
    let points = event.data["coordinates"];

    let canvas = document.getElementById("overlayCanvas");
    let context = canvas.getContext('2d');
    context.beginPath();
    // context.rect(188, 50, 200, 100);
    context.rect(points[0], points[1], points[2], points[3]);
    context.lineWidth = 20;
    context.strokeStyle = 'red';
    context.stroke();

    // this.setState({ screenshot: event.data });
  }
}).bind(this);

let makeWebsocketURL = function() {
  let loc = window.location, new_uri;
  if (loc.protocol === "https:") {
      new_uri = "wss:";
  } else {
      new_uri = "ws:";
  }
  new_uri += "//" + loc.host;
  new_uri += loc.pathname + "stream";

  // console.log(new_uri);

  return new_uri;
}

export default App;