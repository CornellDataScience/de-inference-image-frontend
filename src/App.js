import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Webcam from "react-webcam";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      screenshot: null,
      tab: 0
    };
  }
  
  handleClick = () => {
    const screenshot = this.webcam.getScreenshot();
    this.setState({ screenshot });
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
              <button onClick={this.handleClick}>capture</button>
            </div>
            {this.state.screenshot ? <img src={this.state.screenshot} /> : null}
          </div>
        </div>
      </div>
    );
  }
}

export default App;