
import './App.css';
import { Connect, PeerInfo } from 'alligator-client';
import React, { useState } from 'react';
import 'typeface-source-code-pro'
import '@trendmicro/react-sidenav/dist/react-sidenav.css';

import { Switch, Route, useLocation } from 'react-router-dom';
import Login from "./login.js"
import Main from "./main.js"

function getPeerInfo() {
  let peerInfo = localStorage.getItem('peerInfo');
  if (!peerInfo) localStorage.setItem("peerInfo", peerInfo = PeerInfo().toJSON())
  return PeerInfo.fromJSON(peerInfo)
}

function App() {

  let [connection, setConnection] = useState()

  const peerInfo = getPeerInfo()
  const l = useLocation();

  const [location, setLocation] = useState(connection && l && l.pathname ? l.pathname : "/login")

  const routes = [
    {
      path: "/login",
      load: Login,
      peerInfo,
      onSubmit: (values, { setSubmitting, setErrors }) => {
        Connect(values.url, null, getPeerInfo(), (err, e) => {
          if (err) return setErrors({ url: err.message })
          setConnection(e)
          setLocation("/functions")
        }, (err) => {
          setConnection(null)
          setLocation("/login")

        })
        setSubmitting(false)
      }
    },
    {
      path: "/",
      load: Main,
      connection,
      peerInfo,
      location,
      setLocation

    }
  ]


  return (

    <Switch location={{ pathname: location, state: { fromDashboard: true } }}>
      {routes.map((item, k) => (<Route key={"main" + k} path={item.path} render={() => (<item.load {...item}></item.load>)} />))}
    </Switch>


  );
}

export default App;
