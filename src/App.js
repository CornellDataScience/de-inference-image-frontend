import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Webcam from "react-webcam";

class App extends Component {
  constructor(props) {
    super(props);

    let boundOnReceive = (function (event) {
      // this.setState({ screenshot: event.data }, function () { console.log(this.state.screenshot.slice(0, 50)); } );
      this.setState({ screenshot: event.data });
    }).bind(this);

    this.state = {
      screenshot: null,
      tab: 0,
      socket: new WebSocket(makeWebsocketURL())
    };

    this.state.socket.onmessage = boundOnReceive;
  }
  
  sendImage = () => {
    let screenshot = this.webcam.getScreenshot();
    this.state.socket.send(screenshot);
    // this.setState({ screenshot: screenshot });
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
            {this.state.screenshot ? <img src={this.state.screenshot} /> : null}
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
      this.intervalID = setInterval( () => this.sendImage(), 500
    );
  }

  componentWillUnmount() {
    clearInterval(this.intervalID);
  }
}

let makeWebsocketURL = function() {
  let loc = window.location, new_uri;
  if (loc.protocol === "https:") {
      new_uri = "wss:";
  } else {
      new_uri = "ws:";
  }
  new_uri += "//" + loc.host;
  new_uri += loc.pathname + "/stream";

  return new_uri;
}

export default App;