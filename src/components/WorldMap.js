import React, { Component } from "react";
import axios from "axios";
import { Spin } from "antd";
import { feature } from "topojson-client";
import { geoKavrayskiy7 } from "d3-geo-projection";
import { geoGraticule, geoPath } from "d3-geo";
import { select as d3Select } from "d3-selection";
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";

import {
  BASE_URL,
  WORLD_MAP_URL,
  SATELLITE_POSITION_URL,
  SAT_API_KEY
} from "../constants";


const width = 960;
const height = 600;

class WorldMap extends Component {
    constructor() {
        super();
        this.state = {
          isLoading: false,
          isDrawing: false
        };
        this.map = null;
        this.color = d3Scale.scaleOrdinal(schemeCategory10);
        this.refMap = React.createRef();
        this.refTrack = React.createRef();
      }
    

    componentDidMount() { //拿取世界地图数据
        axios
      .get(WORLD_MAP_URL)
      .then(res => {
        const { data } = res;
        const land = feature(data, data.objects.countries).features;
        this.generateMap(land);
      })
      .catch(e => {
        console.log("err in fetch map data ", e.message);
      });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        //第二次到N次render函数中执行
        if (prevProps.satData !== this.props.satData) {
            //satdata是array，两个array比较不会比较内容
            //这里的目的是检查是否和上次选择的是一样的
          const {
            latitude,
            longitude,
            elevation,
            altitude,
            duration
          } = this.props.observerData;
          const endTime = duration * 60;
    
          this.setState({
            isLoading: true
          });
    
          const urls = this.props.satData.map(sat => {
            //多call几次获得所有的信息
            const { satid } = sat;
            const url = `${BASE_URL}/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;
    
            return axios.get(url);
          });
    
          Promise.all(urls)//all.then确保所有的request都成功返回
            .then(res => {
              const arr = res.map(sat => sat.data);
              this.setState({
                isLoading: false,
                isDrawing: true
              });
    
              if (!prevState.isDrawing) {
                this.track(arr);
                //用的canvas，没必要放state里进行re render
              } else {///如果之前那个还没画完就error message
                const oHint = document.getElementsByClassName("hint")[0];
                oHint.innerHTML =
                  "Please wait for these satellite animation to finish before selection new ones!";
              }
            })
            .catch(e => {
              console.log("err in fetch satellite position -> ", e.message);
            });
        }
      }
    
      track = data => {
        if (!data[0].hasOwnProperty("positions")) {
          throw new Error("no position data");
          return;
        }
    
        const len = data[0].positions.length;
        const { duration } = this.props.observerData;
        const { context2 } = this.map;
    
        let now = new Date();
    
        let i = 0;
    
        let timer = setInterval(() => {
          let ct = new Date();
    
          let timePassed = i === 0 ? 0 : ct - now;
          let time = new Date(now.getTime() + 60 * timePassed);
    
          context2.clearRect(0, 0, width, height);
          //直接整个擦掉
    
          context2.font = "bold 14px sans-serif";
          context2.fillStyle = "#333";
          context2.textAlign = "center";
          context2.fillText(d3TimeFormat(time), width / 2, 10);
    
          if (i >= len) { //当计数器大于所有数据长度，停止
            clearInterval(timer);
            this.setState({ isDrawing: false });
            const oHint = document.getElementsByClassName("hint")[0];
            oHint.innerHTML = "";
            return;
          }
    
          data.forEach(sat => {
            //记录一下info和position然后传给drawsat
            const { info, positions } = sat;
            this.drawSat(info, positions[i]);
          });
    
          i += 60; //
        }, 1000);
      };
    
      drawSat = (sat, pos) => { 
        const { satlongitude, satlatitude } = pos;
    
        if (satlongitude === undefined || !satlatitude) return; 
        //当经纬度 == 0时可能有bug，就是不画图
    
        const { satname } = sat;
        const nameWithNumber = satname.match(/\d+/g).join("");
        //regular expression,移除名字里的-
    
        const { projection, context2 } = this.map;
        //用projection函数将经纬度转换为xy
        const xy = projection([satlongitude, satlatitude]);
    
        context2.fillStyle = this.color(nameWithNumber);
        context2.beginPath();
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);
        //画实心圆
        context2.fill();
    
        context2.font = "bold 11px sans-serif";
        context2.textAlign = "center";
        context2.fillText(nameWithNumber, xy[0], xy[1] + 14);
      };
    
    

    generateMap(land){ //land是个数组，每个国家的边界线，每个点的经纬度
        const projection = geoKavrayskiy7() //projection怎么把地球平面铺平，选择投影方式
            .scale(170)
            .translate([width / 2, height / 2])
            .precision(.1);

        const graticule = geoGraticule(); //经纬度

        const canvas = d3Select(this.refMap.current)
            .attr("width", width)
            .attr("height", height);

        const canvas2 = d3Select(this.refTrack.current)
            .attr("width", width)
            .attr("height", height);
      
        

        const context = canvas.node().getContext("2d");
        const context2 = canvas2.node().getContext("2d");       
        //canvas.node拿取reference

        let path = geoPath() //路径规划
            .projection(projection)
            .context(context);

        land.forEach(ele => {
            context.fillStyle = 'red';
            context.strokeStyle = 'blue';
            context.globalAlpha = 0.8;
            context.beginPath();
            path(ele);
            context.fill();
            context.stroke();

            context.strokeStyle = 'rgba(220, 220, 220, 0.1)';
            context.beginPath();
            path(graticule());
            context.lineWidth = 0.1;
            context.stroke();

            context.beginPath();
            context.lineWidth = 0.5;
            path(graticule.outline());//经纬度的边界
            context.stroke();
        });
        
    this.map = {
        projection: projection,
        graticule: graticule,
        context: context,
        context2: context2
      };
    };
  

    render() { //两个canvas，一个画点另一个作为世界地图，因为擦点的时候如果在一个地图上会把地图也删掉
        const { isLoading } = this.state;
        return (
          <div className="map-box">
            {isLoading ? (
              <div className="spinner">
                <Spin tip="Loading..." size="large" />
              </div>
            ) : null}
            <canvas className="map" ref={this.refMap} />
            <canvas className="track" ref={this.refTrack} /> 
            <div className="hint" />
          </div>
        );
      }
    
}

export default WorldMap;
