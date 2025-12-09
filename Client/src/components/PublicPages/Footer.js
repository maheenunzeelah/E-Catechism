import React, { Component } from "react";
import {Link} from 'react-router-dom'
import { MDBCol, MDBContainer, MDBRow, MDBFooter } from "mdbreact";
import '../../css/footer.css';
import Pdf from '../../images/USER_GUIDE.pdf';

class FooterPage extends Component {
 
    state = {
      isOpen: false
    };
    
    toggleCollapse = () => {
      this.setState({ isOpen: !this.state.isOpen });
    }
    
    render() {
  return (
    <MDBFooter className="main_div "  style={{background:'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)', boxShadow:'0 -4px 20px rgba(0, 0, 0, 0.15)', color:'white'}} >
      <MDBContainer className="text-center text-md-left" style={{color:'white'}}>
        <MDBRow>
        <MDBCol md="4" style={{marginBottom:'30px'}}>
            <h3 className="font-weight-bold" style={{color:'white', marginBottom:'20px', fontSize:'28px'}}>E-Catechism</h3>
            <p style={{color:'rgba(255, 255, 255, 0.9)', lineHeight:'1.8', fontSize:'15px'}}>
             Makes it easy for you to assess students and reduces your workload. Create, manage, and grade tests effortlessly.
            </p>
          </MDBCol>
          <MDBCol md="4" style={{marginBottom:'30px'}}>
            <h5 style={{color:'white', marginBottom:'20px', fontWeight:'600'}}>Quick Links</h5>
            <ul style={{listStyle:'none', paddingLeft:'0'}}>
              <li className="list-unstyled footLink" style={{marginBottom:'12px'}}>
                <Link to="/" style={{color:'rgba(255, 255, 255, 0.9)'}}>Home</Link>
              </li>
              <li className="list-unstyled" style={{marginBottom:'12px'}}>
                <Link to="/tourpage" style={{color:'rgba(255, 255, 255, 0.9)'}}>Take A Tour</Link>
                 <ul style={{listStyle:'none', paddingLeft:'20px', marginTop:'8px'}}>
                   <li className="footLink" style={{marginBottom:'8px'}}>
                   <Link to="/tourpage" style={{color:'rgba(255, 255, 255, 0.8)'}}> Overview</Link>
                   </li>
                   <li className="footLink" style={{marginBottom:'8px'}}>
                     <Link to="/quizSettings" style={{color:'rgba(255, 255, 255, 0.8)'}}>Quiz Settings</Link>
                   </li>
                 </ul>
              </li>
              <li className="list-unstyled footLink" style={{marginBottom:'12px'}}>
                <Link to="/faq" style={{color:'rgba(255, 255, 255, 0.9)'}}>FAQ</Link>
              </li>
              <li className="list-unstyled footLink" style={{marginBottom:'12px'}}>
                <a href={Pdf} target="_blank" rel="noopener noreferrer" style={{color:'rgba(255, 255, 255, 0.9)'}}>User Manual</a>
              </li>
            </ul>
          </MDBCol>
          <MDBCol md="4" style={{marginBottom:'30px'}}>
            <h5 style={{color:'white', marginBottom:'20px', fontWeight:'600'}}>Get Started</h5>
            <ul style={{listStyle:'none', paddingLeft:'0'}}>
              <li className="list-unstyled footLink" style={{marginBottom:'12px'}}>
                <Link to="/contact" style={{color:'rgba(255, 255, 255, 0.9)'}}>Contact Us</Link>
              </li>
              <li className="list-unstyled mt-3">
                <Link to="/signupas" className="reg" style={{color:'white', textDecoration:'none'}}>Register Now</Link>
              </li>
            </ul>
          </MDBCol>
       
        </MDBRow>
      </MDBContainer>
      <div className="footer-copyright text-center py-3" style={{background:'rgba(0, 0, 0, 0.2)', borderTop:'1px solid rgba(255, 255, 255, 0.1)', marginTop:'30px'}}>
        <MDBContainer fluid style={{color:'rgba(255, 255, 255, 0.8)'}}>
          &copy; {new Date().getFullYear()} Copyright: <Link to="/" style={{color:'white', fontWeight:'600'}}> E-Catechism </Link>
        </MDBContainer>
      </div>
    </MDBFooter>
  );
}
}

export default FooterPage;