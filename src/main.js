import Functions from "./funcs.js"
import Identities from "./identities.js"
import Groups from "./groups.js"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAddressBook, faUsers, faUsersCog } from '@fortawesome/free-solid-svg-icons'
import SideNav, { NavItem, NavIcon, NavText } from '@trendmicro/react-sidenav';
import { Switch, Route } from 'react-router-dom';
import React, { useState } from 'react';
import util from "icebreaker-network/lib/util"


function NoMatch() {
  return (<h1>404 not found</h1>)
}

function Main({ location, setLocation, connection, peerInfo }) {
  const menu = [

    {
      title: "Functions",
      icon: faAddressBook,
      path: "/functions",
      load: Functions
    },
    {
      title: "Identitites",
      icon: faUsers,
      path: "/identitites",
      load: Identities
    },


    {
      title: "Groups",
      icon: faUsersCog,
      path: "/groups",
      load: Groups
    }

  ]
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ paddingLeft: expanded ? "240px" : "64px", display: "flex", flexDirection: "column" }}>

      <div>
        <SideNav style={{ background: "black", position: "fixed" }} expanded={expanded}
          onToggle={(expanded) => setExpanded(expanded)}
          onSelect={(selected) => {
            setLocation(selected)
            setExpanded(false);
            //seselected
          }}
        >
          <SideNav.Toggle />
          <SideNav.Nav defaultSelected={menu[0].path}>
            {menu.map((item, index) => (
              <NavItem key={"navitem" + index} eventKey={item.path} >
                <NavIcon key={"navicon" + index} >
                  <FontAwesomeIcon icon={item.icon} />
                </NavIcon>
                <NavText key={"navtext" + index}>
                  {item.title}
                </NavText>
              </NavItem>
            ))}
          </SideNav.Nav>
        </SideNav>
      </div>


      <div>
        <div className="header">
          <div className="left">

            <h1>Alligator Island</h1>
            <div className="id">ID: {peerInfo ? util.encode(peerInfo.keys.publicKey, peerInfo.encoding) : ''}</div>
          </div>
          <div>
            <img alt="Alligator Island" className="logo" src="./logo.png" />
          </div>
        </div>
        <Switch location={{ pathname: location, state: { fromDashboard: true } }}>
          {menu.map((item, k) => (<Route key={"menu" + k} path={item.path} render={() => (<item.load connection={connection} expanded={expanded}  {...item}></item.load>)} />))}
          <Route component={NoMatch} />
        </Switch>

      </div>

    </div>
  )
}
export default Main