import React, { Component } from 'react';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Checkbox, Row, Col, Thumbnail, ControlLabel, ListGroup, ListGroupItem, FormGroup, FormControl, FormGroupItem, Panel, Modal, Well } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import { LinkContainer } from 'react-router-bootstrap';
import LoweringReplayMap from './lowering_replay_map';
import Datetime from 'react-datetime';
import moment from 'moment';
import ImagePreviewModal from './image_preview_modal';

import * as actions from '../actions';

import { API_ROOT_URL, IMAGE_PATH, ROOT_PATH } from '../client_config';

const cookies = new Cookies();

class EventShowDetailsModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      event: {},
      mapHeight: 0
    }

    this.handleImagePreviewModal = this.handleImagePreviewModal.bind(this);

  }

  static propTypes = {
    event_id: PropTypes.string.isRequired,
    handleHide: PropTypes.func.isRequired,
    handleUpdateEvent: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.initEvent()
  }

  componentDidUpdate() {
    // if(this.state.mapHeight != this.mapPanel.clientHeight) {
    //   this.setState({mapHeight: this.mapPanel.clientHeight });
    // }
  }

  componentWillUnmount() {
  }

  initEvent() {
    axios.get(`${API_ROOT_URL}/api/v1/event_exports/${this.props.event_id}`,
      {
        headers: {
        authorization: cookies.get('token')
        }
      }      
    )
    .then((response) => {
      this.setState({event: response.data})
    })
    .catch((error) => {
      console.log(error);
    });
  }

  handleMissingImage(ev) {
    ev.target.src = `${ROOT_PATH}images/noimage.jpeg`
  }

  handleImagePreviewModal(source, filepath) {
    this.props.showModal('imagePreview', { name: source, filepath: filepath })
  }

  renderImage(source, filepath) {
    return (
      <Thumbnail onError={this.handleMissingImage} src={filepath} onClick={ () => this.handleImagePreviewModal(source, filepath)}>
        <div>{`${source}`}</div>
      </Thumbnail>
    )
  }

  renderImageryPanel() {
    if(this.props.event_id && this.state.event.aux_data) { 
      if (this.state.event.event_value == "SuliusCam") {
        let tmpData =[]

        for (let i = 0; i < this.state.event.event_options.length; i++) {
          if (this.state.event.event_options[i].event_option_name == "filename") {
            tmpData.push({source: "SuliusCam", filepath: API_ROOT_URL + IMAGE_PATH + this.state.event.event_options[i].event_option_value} )
          } 
        }

        return (
          <Row>
            {
              tmpData.map((camera) => {
                return (
                  <Col key={camera.source} xs={12} sm={6} md={3}>
                    {this.renderImage(camera.source, camera.filepath)}
                  </Col>
                )
              })
            }
          </Row>
        )
      } else {
        let frameGrabberData = this.state.event.aux_data.find(aux_data => aux_data.data_source == 'vehicleRealtimeFramegrabberData')
        let tmpData = []

        if(frameGrabberData) {
          for (let i = 0; i < frameGrabberData.data_array.length; i+=2) {
      
            tmpData.push({source: frameGrabberData.data_array[i].data_value, filepath: API_ROOT_URL + IMAGE_PATH + frameGrabberData.data_array[i+1].data_value} )
          }

          return (
            <Row>
              {
                tmpData.map((camera) => {
                  return (
                    <Col key={camera.source} xs={12} sm={6} md={3}>
                      {this.renderImage(camera.source, camera.filepath)}
                    </Col>
                  )
                })
              }
            </Row>
          )
        }
      }
    }
  }

  renderNavLatLonPanel() {

    let realtime_latitude = 'n/a'
    let realtime_longitude = 'n/a'

    let renav_latitude = 'n/a'
    let renav_longitude = 'n/a'

    let delta_latitude = 'n/a'
    let delta_longitude = 'n/a'

    if(this.state.event.aux_data) {
      let vehicleRealtimeNavData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
      if(vehicleRealtimeNavData) {
        let xObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "latitude")
        realtime_latitude = (xObj)? `${xObj.data_value} ${xObj.data_uom}` : 'n/a'
        delta_latitude = (xObj)? `${parseFloat(xObj.data_value)}` : 'n/a'

        let yObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "longitude")
        realtime_longitude = (yObj)? `${yObj.data_value} ${yObj.data_uom}` : 'n/a'
        delta_longitude = (yObj)? `${parseFloat(yObj.data_value)}` : 'n/a'
      }
    }

    if(this.state.event.aux_data) {
      let vehicleReNavData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleReNavData")
      if(vehicleReNavData) {
        let xObj = vehicleReNavData.data_array.find(data => data.data_name == "latitude")
        renav_latitude = (xObj)? `${parseFloat(xObj.data_value).toFixed(6)} ${xObj.data_uom}` : 'n/a'
        delta_latitude = (xObj)? `${(delta_latitude - parseFloat(xObj.data_value)).toFixed(6)} ddeg` : 'n/a'

        let yObj = vehicleReNavData.data_array.find(data => data.data_name == "longitude")
        renav_longitude = (yObj)? `${parseFloat(yObj.data_value).toFixed(6)} ${yObj.data_uom}` : 'n/a'
        delta_longitude = (yObj)? `${(delta_longitude - parseFloat(yObj.data_value)).toFixed(6)} ddeg` : 'n/a'
      } else {
        delta_latitude = 'n/a'
        delta_longitude = 'n/a'
      }
    }


    return (
      <Panel>
        <Panel.Heading>Lat/Lng Coordinates</Panel.Heading>
        <Panel.Body>
          <strong>Realtime</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            Lat:<span className="pull-right">{`${realtime_latitude}`}</span><br/>
            Lng:<span className="pull-right">{`${realtime_longitude}`}</span><br/>
          </div>
          <strong>ReNav</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            Lat:<span className="pull-right">{`${renav_latitude}`}</span><br/>
            Lng:<span className="pull-right">{`${renav_longitude}`}</span><br/>
          </div>
          <strong>Delta</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            Lat:<span className="pull-right">{`${delta_latitude}`}</span><br/>
            Lng:<span className="pull-right">{`${delta_longitude}`}</span><br/>
          </div>
        </Panel.Body>
      </Panel>
    );
  }

  renderNavAlvCoordPanel() {

    let realtime_alvin_x = 'n/a'
    let realtime_alvin_y = 'n/a'

    let renav_alvin_x = 'n/a'
    let renav_alvin_y = 'n/a'

    let delta_alvin_x = 'n/a'
    let delta_alvin_y = 'n/a'

    if(this.state.event.aux_data) {
      let alvinRealtimeAlvinCoordData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeAlvinCoordData")
      if(alvinRealtimeAlvinCoordData) {
        let xObj = alvinRealtimeAlvinCoordData.data_array.find(data => data.data_name == "alvin_x")
        realtime_alvin_x = (xObj)? `${xObj.data_value} ${xObj.data_uom}` : 'n/a'
        delta_alvin_x = (xObj)? `${parseFloat(xObj.data_value)}` : 'n/a'

        let yObj = alvinRealtimeAlvinCoordData.data_array.find(data => data.data_name == "alvin_y")
        realtime_alvin_y = (yObj)? `${yObj.data_value} ${yObj.data_uom}` : 'n/a'
        delta_alvin_y = (yObj)? `${parseFloat(yObj.data_value)}` : 'n/a'
      }
    }

    if(this.state.event.aux_data) {
      let alvinReNavAlvinCoordData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleReNavAlvinCoordData")
      if(alvinReNavAlvinCoordData) {
        let xObj = alvinReNavAlvinCoordData.data_array.find(data => data.data_name == "alvin_x")
        renav_alvin_x = (xObj)? `${parseFloat(xObj.data_value).toFixed(2)} ${xObj.data_uom}` : 'n/a'
        delta_alvin_x = (xObj)? `${(delta_alvin_x - parseFloat(xObj.data_value)).toFixed(2)} meters` : 'n/a'

        let yObj = alvinReNavAlvinCoordData.data_array.find(data => data.data_name == "alvin_y")
        renav_alvin_y = (yObj)? `${parseFloat(yObj.data_value).toFixed(2)} ${yObj.data_uom}` : 'n/a'
        delta_alvin_y = (yObj)? `${(delta_alvin_y - parseFloat(yObj.data_value)).toFixed(2)} meters` : 'n/a'
      } else {
        delta_alvin_x = 'n/a'
        delta_alvin_y = 'n/a'
      }
    }

    return (
      <Panel>
        <Panel.Heading>Alvin Coordinates</Panel.Heading>
        <Panel.Body>
          <strong>Realtime</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            X:<span className="pull-right">{`${realtime_alvin_x}`}</span><br/>
            Y:<span className="pull-right">{`${realtime_alvin_y}`}</span><br/>
          </div>
          <strong>ReNav</strong><br/>
            <div style={{paddingLeft: "10px"}}>
            X:<span className="pull-right">{`${renav_alvin_x}`}</span><br/>
            Y:<span className="pull-right">{`${renav_alvin_y}`}</span><br/>
          </div>
          <strong>Delta</strong><br/>
            <div style={{paddingLeft: "10px"}}>
            X:<span className="pull-right">{`${delta_alvin_x}`}</span><br/>
            Y:<span className="pull-right">{`${delta_alvin_y}`}</span><br/>
          </div>
        </Panel.Body>
      </Panel>
    );
  }

  renderAttitudePanel() {
    let depth = 'n/a'
    let alt = 'n/a'
    let hdg = 'n/a'
    let pitch = 'n/a'
    let roll = 'n/a'

    if(this.state.event.aux_data) {
      let vehicleRealtimeNavData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
      if(vehicleRealtimeNavData) {
        let depthObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "depth")
        depth = (depthObj)? `${depthObj.data_value} ${depthObj.data_uom}` : 'n/a'

        let altObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "altitude")
        alt = (altObj)? `${altObj.data_value} ${altObj.data_uom}` : 'n/a'

        let hdgObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "heading")
        hdg = (hdgObj)? `${hdgObj.data_value} ${hdgObj.data_uom}` : 'n/a'

        let pitchObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "pitch")
        pitch = (pitchObj)? `${pitchObj.data_value} ${pitchObj.data_uom}` : 'n/a'

        let rollObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "roll")
        roll = (rollObj)? `${rollObj.data_value} ${rollObj.data_uom}` : 'n/a'

      }
    }  

    return (
      <Panel>
        <Panel.Heading>Vehicle Attitude</Panel.Heading>
        <Panel.Body>
          <strong>Realtime</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            Depth:<span className="pull-right">{`${depth}`}</span><br/>
            Alt:<span className="pull-right">{`${alt}`}</span><br/>
            Hdg:<span className="pull-right">{`${hdg}`}</span><br/>
            Pitch:<span className="pull-right">{`${pitch}`}</span><br/>
            Roll:<span className="pull-right">{`${roll}`}</span><br/>
          </div>
        </Panel.Body>
      </Panel>
    );
  }

  renderSensorPanel() {
    let ctd_c = 'n/a'
    let ctd_t = 'n/a'
    let ctd_d = 'n/a'
    let temp_probe = 'n/a'
    let mag_x = 'n/a'
    let mag_y = 'n/a'
    let mag_z = 'n/a'

    if(this.state.event.aux_data) {
      let vehicleCTDData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeCTDData")
      if(vehicleCTDData) {
        let ctd_cObj = vehicleCTDData.data_array.find(data => data.data_name == "ctd_c")
        ctd_c = (ctd_cObj)? `${ctd_cObj.data_value} ${ctd_cObj.data_uom}` : 'n/a'

        let ctd_tObj = vehicleCTDData.data_array.find(data => data.data_name == "ctd_t")
        ctd_t = (ctd_tObj)? `${ctd_tObj.data_value} ${ctd_tObj.data_uom}` : 'n/a'

        let ctd_dObj = vehicleCTDData.data_array.find(data => data.data_name == "ctd_d")
        ctd_d = (ctd_dObj)? `${ctd_dObj.data_value} ${ctd_dObj.data_uom}` : 'n/a'
      }

      let vehicleTempProbeData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeTempProbeData")
      if(vehicleTempProbeData) {
        let temp_probeObj = vehicleTempProbeData.data_array.find(data => data.data_name == "ctd_c")
        temp_probe = (temp_probeObj)? `${temp_probeObj.data_value} ${temp_probeObj.data_uom}` : 'n/a'
      }

      let vehicleMagData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeMAGData")
      if(vehicleMagData) {
        let mag_xObj = vehicleMagData.data_array.find(data => data.data_name == "x-axis")
        mag_x = (mag_xObj)? `${mag_xObj.data_value} ${mag_xObj.data_uom}` : 'n/a'

        let mag_yObj = vehicleMagData.data_array.find(data => data.data_name == "y-axis")
        mag_y = (mag_yObj)? `${mag_yObj.data_value} ${mag_yObj.data_uom}` : 'n/a'

        let mag_zObj = vehicleMagData.data_array.find(data => data.data_name == "z-axis")
        mag_z = (mag_zObj)? `${mag_zObj.data_value} ${mag_zObj.data_uom}` : 'n/a'
      }
    }  

    return (
      <Panel>
        <Panel.Heading>Sensor Data</Panel.Heading>
        <Panel.Body>
          <Row>
            <Col sm={12} md={12}>
              <strong>CTD</strong><br/>
              <div style={{paddingLeft: "10px"}}>
                C:<span className="pull-right">{`${ctd_c}`}</span><br/>
                T:<span className="pull-right">{`${ctd_t}`}</span><br/>
                D:<span className="pull-right">{`${ctd_d}`}</span><br/>
              </div>
            </Col>
            <Col sm={12} md={12}>
              <strong>Temp Probe</strong><br/>
              <div style={{paddingLeft: "10px"}}>
                Temp:<span className="pull-right">{`${temp_probe}`}</span><br/>
              </div>
            </Col>
            <Col sm={12} md={12}>
              <strong>Magnetometer</strong><br/>
              <div style={{paddingLeft: "10px"}}>
                X:<span className="pull-right">{`${mag_x}`}</span><br/>
                Y:<span className="pull-right">{`${mag_y}`}</span><br/>
                Z:<span className="pull-right">{`${mag_z}`}</span><br/>
              </div>
            </Col>
          </Row>
        </Panel.Body>
      </Panel>
    );
  }

  renderMapPanel() {

    const mapRatio = (new Date(this.state.event.ts) <= new Date("2013-12-31"))? "embed-responsive-4by3" : "embed-responsive-16by9"

    return (
      <Panel id="MapPanel" style={{backgroundColor: "#282828"}}>
        <Panel.Body style={{padding: "4px", marginBottom: "10px"}}>
          <div ref={ (mapPanel) => this.mapPanel = mapPanel} className={`embed-responsive ${mapRatio}`}>
            <LoweringReplayMap height={this.state.mapHeight} event={this.state.event}/>
          </div>
          <div style={{marginTop: "8px", marginLeft: "10px"}}>Map</div>
        </Panel.Body>
      </Panel>
    )
  }


  render() {
    const { show, handleHide } = this.props

    let eventOptionsArray = [];
    let event_free_text = (this.state.event.event_free_text)? (<ListGroup><ListGroupItem>Text: {this.state.event.event_free_text}</ListGroupItem></ListGroup>) : null;
    let event_comment = null;

    if(this.state.event.event_options) {

      eventOptionsArray = this.state.event.event_options.reduce((filtered, option) => {
        if (option.event_option_name == 'event_comment') {
          event_comment = (<ListGroup><ListGroupItem>Comment: {option.event_option_value}</ListGroupItem></ListGroup>);
        } else {
          filtered.push(<ListGroupItem key={`option_${option.event_option_name}`}>{`${option.event_option_name}: "${option.event_option_value}"`}</ListGroupItem>);
        }
        return filtered
      }, [])
      
      return (
        <Modal bsSize="large" show={show} onHide={handleHide}>
            <ImagePreviewModal />;
            <Modal.Header closeButton>
              <Modal.Title>Event Details: {this.state.event.event_value}</Modal.Title>
              Date: {this.state.event.ts}<br/>
              User: {this.state.event.event_author}
            </Modal.Header>

            <Modal.Body>
              <Row>
                <Col sm={12}>
                  {this.renderImageryPanel()}
                </Col>
              </Row>
              <Row>
                <Col sm={6} md={3} lg={3}>
                  {this.renderNavLatLonPanel()}
                </Col>
                <Col sm={6} md={3} lg={3}>
                  {this.renderNavAlvCoordPanel()}
                </Col>
                <Col sm={6} md={3} lg={3}>
                  {this.renderAttitudePanel()}
                </Col>
                <Col sm={6} md={3} lg={3}>
                  {this.renderSensorPanel()}
                </Col>
                <Col sm={6} md={3} lg={3}>
                  <ListGroup>
                    {eventOptionsArray}
                  </ListGroup>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  {event_free_text}
                </Col>
                <Col xs={12}>
                  {event_comment}
                </Col>
              </Row>
            </Modal.Body>
        </Modal>
      );
    } else {
      return (
        <Modal bsSize="large" show={show} onHide={handleHide}>
          <Modal.Header closeButton>
            <Modal.Title>Event Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Loading...
          </Modal.Body>
        </Modal>
      );
    }
  }
}

function mapStateToProps(state) {

  return {
    lowering: state.lowering.lowering,
    roles: state.user.profile.roles,
  }

}

EventShowDetailsModal = connect(
  mapStateToProps, actions
)(EventShowDetailsModal)

export default connectModal({ name: 'eventShowDetails', destroyOnHide: true })(EventShowDetailsModal)
