import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { BrowserRouter as Router} from 'react-router-dom';
import { ModalProvider } from "react-modal-hook";

ReactDOM.render(
  <React.StrictMode>
    <Router>
    <ModalProvider><App /></ModalProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

//reportWebVitals();
