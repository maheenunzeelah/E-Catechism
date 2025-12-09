import React, { Component } from "react";
import ReactDOM from 'react-dom';
import { MDBNavbar, MDBNavbarBrand, MDBNavbarNav, MDBNavItem, MDBNavLink, MDBNavbarToggler, MDBCollapse , MDBIcon} from "mdbreact";
import { BrowserRouter as Router, Link } from 'react-router-dom';
import TourPage from "./TourPage";
import Signup from "../Authentication/Signup";
import Login from '../Authentication/login';
import '../../css/Navbar.css';

class NavbarPage extends Component {

 

  render() {
   
  
    return (
      <div>
        <nav className="navbar navbar-expand-lg navbar-light navb">
          <Link className="navbar-brand " to="/" style={{textDecoration:'none'}}>
            <h3 className="font-weight-bold" style={{color:'white', margin:0, fontSize:'24px', letterSpacing:'0.5px'}}>E-Catechism</h3>
          </Link>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarTogglerDemo02" aria-controls="navbarTogglerDemo02" aria-expanded="false" aria-label="Toggle navigation" style={{borderColor:'rgba(255, 255, 255, 0.5)'}}>
            <span className="navbar-toggler-icon"></span>
          </button>
          <ul className="navbar-nav ml-auto mt-2 mr-5 mt-lg-0 " >
            <li className="nav-item pr-3">
              <Link className="nav-link links" to="/login" style={{color:'white', padding:'8px 16px', borderRadius:'6px'}}>
                Login<MDBIcon icon="sign-in-alt" className="ml-2"/>
              </Link>
            </li>
            <li className="nav-item ">
              <Link className="nav-link links" to="/signupas" style={{color:'white', padding:'8px 16px', borderRadius:'6px', backgroundColor:'rgba(255, 255, 255, 0.15)'}}>
                Signup<MDBIcon icon="user-plus" className="ml-2"/>
              </Link>
            </li>
          </ul>
        </nav>
        <nav className="navbar navbar-expand-lg navbar-light subNav" >
          <div className="collapse navbar-collapse" id="navbarTogglerDemo02">
            <ul className="navbar-nav mr-auto mt-2 mt-lg-0">
              <li className="nav-item ">
                <Link className="nav-link links" to="/" >Home </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link links" to="/tourpage">Take A Tour </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link links" to="/faq">Faq </Link>
              </li>
              <li className="nav-item ">
                <Link className="nav-link links" to="/contact">Contact</Link>
              </li>
            </ul>

          </div>
        </nav>
      </div>
    );
  }
}

export default NavbarPage;