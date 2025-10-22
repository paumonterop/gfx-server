import React, { useState, useEffect } from "react";
import Tables2 from './DashBoard/Tablev2'
import Operation from "./DashBoard/Operation";
import { MarginOutlined } from "@mui/icons-material";

const Dashboard = () => {
  
  return (
    <div   
    style={{
      display: 'flex',
      transform: 'scale(0.682)',
      transformOrigin: 'top left',
      backgroundColor: 'black',
      position: 'absolute',
      maxWidth: '100%',
      left: 0
  }}>
      <Tables2 />
      {<Operation/>}
    </div>
  );
};

export default Dashboard;
