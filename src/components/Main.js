import React, {Component} from 'react';
import { Row, Col } from 'antd';
import axios from 'axios';
import SatSetting from './SatSetting';
import SatelliteList from './SatelliteList';
import WorldMap from './WorldMap';
import {BASE_URL, NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY} from "../constants";
//请求数据在main.js，返回的数据需要返回到state，sats和用户互动通知main.js需要去请求数据，通过call back function
class Main extends Component {
    constructor(){
        super();
        this.state = {
            satInfo: null,
            settings: null,
            satList: null,
            isLoadingList: false
        };
    }
    /*const Main = () => {
        const[satInfo, setSatInfo] = useState({
            satInfo: null,
            settings: null,
            isLoadingList: false
        });
    }
     */

    showNearbySatellite = (setting) => { //请求数据，setting来自于satsetting收集的数据
        this.setState({
            isLoadingList: true,
            setting: setting
        })
        this.fetchSatellite(setting); 
    }

    fetchSatellite= (setting) => {
        const {latitude, longitude, elevation, altitude} = setting; //解构
        const url = `${BASE_URL }/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`;//url组装

   this.setState({
       isLoadingList: true
   });

   axios.get(url)
       .then(response => {
           console.log(response.data)
           this.setState({
               satInfo: response.data,
               isLoadingList: false
           })
       })
       .catch(error => {
           console.log('err in fetch satellite -> ', error);
       })
}
showMap = (selected) => { //当用户点track on map时候这个会被调用
    //需要用setting
    this.setState(preState => ({
        ...preState,
        satList: [...selected]
    }))
}


    render() { //onShow从satsetting从showSatellite values传
        const { satInfo, isLoadingList, satList, setting } = this.state;
        return (
            <Row className='main'>
                <Col span={8} className='left-side'>
                    <SatSetting onShow={this.showNearbySatellite}/> 
                    <SatelliteList satInfo={satInfo}
                                   isLoad={isLoadingList}
                                   onShowMap={this.showMap}
                    />
                </Col>
                <Col span={16} className="right-side">
                    <WorldMap satData={satList} observerData={setting}/>
                </Col>
            </Row>
        );
    }
}

export default Main;
