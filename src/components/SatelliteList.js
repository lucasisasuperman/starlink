import React, {Component} from 'react';
import { List, Avatar, Button, Checkbox, Spin } from 'antd';
import satellite from "../assets/images/satellite.svg";

class SatelliteList extends Component {
    constructor(){
        super();
        this.state = {
            selected: [] //subset
        };
    }

    onChange = e => {
        const { dataInfo, checked } = e.target;
        const { selected } = this.state; //read only,用setState更新
        const list = this.addOrRemove(dataInfo, checked, selected);
        this.setState({ selected: list }) //更新selected list
    }

    addOrRemove = (item, status, list) => { //一般不要对local variable进行重复值
        const found = list.some( entry => entry.satid === item.satid); //some里的callback entry函数运行到每个元素里面，只要有一次返回true就返回true，检查是否有一个元素满足要求
        if(status && !found){ //status代表是否勾选，found代表原数组中有没有找到
            list=[...list, item] //生成一个新数组，浅拷贝list并添加item
        }

        if(!status && found){
            list = list.filter( entry => {//生成一个新数组，filter检查是否符合条件
                return entry.satid !== item.satid;
            });
        }
        return list;
    }

    onShowSatMap = () =>{ //调用顶层onShowMap component，准备数据画图，要call api，因为satmap和map没有联系，需要从顶层传
        this.props.onShowMap(this.state.selected);
    }

    render() {
        const satList = this.props.satInfo ? this.props.satInfo.above : [];
        const { isLoad } = this.props;
        const { selected } = this.state;

        return (
            <div className="sat-list-box">
                <Button className="sat-list-btn"
                        size="large"
                        disabled={ selected.length === 0} //已选中的 == 0代表都没有选中，length == 0，disable不能点
                        onClick={this.onShowSatMap}
                >Track on the map</Button>
                <hr/>

                {
                    isLoad ?
                        <div className="spin-box">
                            <Spin tip="Loading..." size="large" />
                        </div>
                        :
                        <List
                            className="sat-list"
                            itemLayout="horizontal"
                            size="small"
                            dataSource={satList}
                            renderItem={item => (
                                <List.Item
                                    actions={[<Checkbox dataInfo={item} onChange={this.onChange}/>]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar size={50} src={satellite} />}
                                        title={<p>{item.satname}</p>}
                                        description={`Launch Date: ${item.launchDate}`}
                                    />

                                </List.Item>
                            )}
                        />
                }
            </div>
        );
    }
}

export default SatelliteList;
