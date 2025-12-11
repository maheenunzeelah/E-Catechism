import React, { Component } from "react";
import { MDBNavbar, MDBNavbarToggler, MDBCollapse, MDBNavbarNav, MDBIcon, MDBBtn, MDBDropdown, MDBDropdownMenu, MDBDropdownToggle, MDBDropdownItem, MDBTable, MDBTableBody, MDBTableHead, MDBNavbarBrand } from "mdbreact";
import { BrowserRouter as Router, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { logout } from './../actions';
import Spinner from './Spinner';

class Dashboard extends Component {
  state = {
    isOpen: false
  };

  toggleCollapse = () => {
    this.setState({ isOpen: !this.state.isOpen });
  }
  handleClick = (e) => {
    e.preventDefault()
    this.props.logout()
  }

  render() {

    const { isAuthenticatedTeacher, isAuthenticatedStudent, user} = this.props.auth;
   
   if (isAuthenticatedTeacher) {
      return (
        <MDBNavbar style={{ background: "linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }} dark expand="md">
          <MDBNavbarToggler onClick={this.toggleCollapse} />
          <MDBCollapse id="navbarCollapse3" isOpen={this.state.isOpen} navbar>
            <MDBNavbarNav left>
              <MDBDropdown>
                <MDBDropdownToggle caret color="white">
                  Dashboard
                    </MDBDropdownToggle>
                <MDBDropdownMenu color="dark" basic>
                  <MDBTable borderless>
                    <MDBTableHead color="white" textWhite>
                      <tr>
                        <th><MDBDropdownItem><u>Recent Results</u></MDBDropdownItem></th>
                        <th><MDBDropdownItem>Tests</MDBDropdownItem></th>
                        <th><MDBDropdownItem>Groups</MDBDropdownItem></th>
                      </tr>
                    </MDBTableHead>
                    <MDBTableBody>
                      <tr>
                        <td><MDBDropdownItem>By Test</MDBDropdownItem></td>
                        <td><MDBDropdownItem>Question Bank</MDBDropdownItem></td>
                        <td><MDBDropdownItem>Export</MDBDropdownItem></td>
                      </tr>
                      <tr>
                        <td><MDBDropdownItem>By Group</MDBDropdownItem></td>
                        <td><MDBDropdownItem>Categories</MDBDropdownItem></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td></td>
                        <td><MDBDropdownItem>Files</MDBDropdownItem></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td></td>
                        <td><MDBDropdownItem>Certificates</MDBDropdownItem></td>
                        <td></td>
                      </tr>
                      <tr>
                        <th><MDBDropdownItem><u>Statistics</u></MDBDropdownItem></th>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td><MDBDropdownItem>By Test</MDBDropdownItem></td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td><MDBDropdownItem>By Group</MDBDropdownItem></td>
                        <td><MDBDropdownItem><a className="purple-text font-weight-bold">New Test+</a></MDBDropdownItem></td>
                        <td><MDBDropdownItem><a className="purple-text font-weight-bold">New Group+</a></MDBDropdownItem></td>
                      </tr>
                    </MDBTableBody>
                  </MDBTable>
                </MDBDropdownMenu>
              </MDBDropdown>

              <MDBDropdown>
                <MDBDropdownToggle caret color="white">
                  Help
                    </MDBDropdownToggle>
                <MDBDropdownMenu color="dark" basic>
                  <MDBDropdownItem>User Manual</MDBDropdownItem>
                  <MDBDropdownItem>FAQ</MDBDropdownItem>
                  <MDBDropdownItem divider />
                  <MDBDropdownItem>Contact Us</MDBDropdownItem>
                </MDBDropdownMenu>
              </MDBDropdown>
            </MDBNavbarNav>

            <MDBNavbarNav right>
              {/* <MDBDropdown>
                    <MDBDropdownToggle caret color="dark">
                        My Account
                    </MDBDropdownToggle>
                    <MDBDropdownMenu color="dark" basic>
                        <MDBDropdownItem>Action</MDBDropdownItem>
                        <MDBDropdownItem>Another Action</MDBDropdownItem>
                        <MDBDropdownItem>Something else here</MDBDropdownItem>
                        <MDBDropdownItem divider />
                        <MDBDropdownItem>Separated link</MDBDropdownItem>
                    </MDBDropdownMenu>
                </MDBDropdown> */}
              <MDBBtn className="mr-2 black" color="white" >My Account</MDBBtn>
              <MDBBtn className="mr-2 black" color="white"><MDBIcon icon="search" /></MDBBtn>
              <MDBBtn className="mr-2 black" color="white" onClick={this.handleClick}>Log out</MDBBtn>
            </MDBNavbarNav>
          </MDBCollapse>
        </MDBNavbar>
      );
    }
    else if (isAuthenticatedStudent) {
      return (
        <Router>
        <MDBNavbar style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }} className="purple-text" expand="md">
        <MDBNavbarToggler onClick={this.toggleCollapse} />
        <MDBCollapse id="navbarCollapse3" isOpen={this.state.isOpen} navbar>
          <MDBNavbarBrand>
            <strong><h3 className="font-weight-bold" style={{color:'#6D28D9'}}>E-Catechism</h3></strong>
          </MDBNavbarBrand>
          
          <MDBNavbarNav right>
           
            <MDBBtn className="mr-2" style={{ backgroundColor: 'transparent', color: '#6D28D9', border: '2px solid #6D28D9', fontWeight: '600' }}>My Account</MDBBtn>
            
            <MDBBtn className="mr-2" style={{ backgroundColor: 'transparent', color: '#6D28D9', border: '2px solid #6D28D9', fontWeight: '600' }} onClick={this.handleClick}>Log out</MDBBtn>
          </MDBNavbarNav>
        </MDBCollapse>
      </MDBNavbar>  
        <MDBNavbar style={{ background: "linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }} dark expand="md">
        <MDBNavbarToggler onClick={this.toggleCollapse} />
        <MDBCollapse id="navbarCollapse3" isOpen={this.state.isOpen} navbar>
      
          <MDBNavbarNav left>
          <Link to="/student"><MDBBtn className="mr-2" style={{ backgroundColor: 'white', color: '#6D28D9', border: 'none', fontWeight: '600' }}>Tests</MDBBtn></Link>
          <MDBBtn className="mr-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)', color: 'white', border: 'none', fontWeight: '600' }} disabled>Group</MDBBtn>
          </MDBNavbarNav>

        </MDBCollapse>
      </MDBNavbar>
      </Router>
      )
    }
  }
}
Dashboard.propTypes = {
  logout: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired
}
const mapStateToProps = (state) => {

  return {
    auth: state.auth
  }
}

export default connect(mapStateToProps, { logout })(Dashboard);