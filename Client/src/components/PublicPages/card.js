import React from 'react';
import Overview from './Overview';
import Video from './Video';
import {Link} from 'react-router-dom';

function Card(){
return(
    <div className="card purple-text font-weight-bold " style={{background:"#ffffff", border:"1px solid #e5e7eb", borderRadius:"12px", boxShadow:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", color:"#1f2937" }}>
     <div className="row">
     <div className="col-lg-1"></div>
     <div className="col-lg-4">
     <div className="list-group " style={{width:'300px' , margin:"20px auto 20px 30px" }} >
     <Link  to="/tourpage" > <button type="button" className="list-group-item list-group-item-secondary  list-group-item-action pink lighten-5 mb-5 mt-5" >
        <p style={{color:'#6D28D9'}}>Overview</p>
        </button></Link>
        <Link to="/quizSettings" style={{color:'#6D28D9'}}><button type="button" className="list-group-item list-group-item-secondary list-group-item-action pink lighten-5" ><p style={{color:'#6D28D9'}}>Quiz Settings</p></button></Link>
        {/* <button type="button" className="list-group-item list-group-item-secondary list-group-item-action pink-text  pink lighten-5 ">Quiz Results</button> */}
        {/* <button type="button" className="list-group-item list-group-item-secondary list-group-item-action pink-text  pink lighten-5">Quiz Access</button>
        <button type="button" className="list-group-item list-group-item-secondary list-group-item-action pink-text  pink lighten-5">API/ Integrate</button> */}
        {/* <button type="button" className="list-group-item list-group-item-secondary list-group-item-action pink-text  pink lighten-5">Customers</button> */}
    </div>
    </div>
    <div className="col-lg-7" style={{marginTop:"20px"}}>
    <Video />
    </div>
    </div>
   </div>
);
}

export default Card;