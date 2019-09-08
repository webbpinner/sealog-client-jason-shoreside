import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { connect } from 'react-redux';
import { Button, Row, Col, Dropdown, Grid, Panel, Accordion, Pagination, ListGroup, ListGroupItem, MenuItem, Thumbnail, Well, OverlayTrigger, Tooltip, ButtonToolbar, DropdownButton } from 'react-bootstrap';
import 'rc-slider/assets/index.css';
import Slider, { createSliderWithTooltip } from 'rc-slider';
import EventFilterForm from './event_filter_form';
import ImagePreviewModal from './image_preview_modal';
import EventCommentModal from './event_comment_modal';
import LoweringReplayMap from './lowering_replay_map';
import LoweringDropdown from './lowering_dropdown';
import LoweringModeDropdown from './lowering_mode_dropdown';
import * as actions from '../actions';
import { ROOT_PATH, API_ROOT_URL, IMAGE_PATH } from '../client_config';

let fileDownload = require('js-file-download');

const dateFormat = "YYYYMMDD"
const timeFormat = "HHmm"

const cookies = new Cookies();

const imagePanelStyle = {minHeight: "100px"}

const playTimer = 3000
const ffwdTimer = 1000

const PLAY = 0
const PAUSE = 1
const FFWD = 2
const FREV = 3

const maxEventsPerPage = 8;

const SliderWithTooltip = createSliderWithTooltip(Slider);

class LoweringReplay extends Component {

  constructor (props) {
    super(props);

    this.state = {
      replayTimer: null,
      replayState: PAUSE,
      replayEventIndex: 0,
      hideASNAP: false,
      activePage: 1,
      mapHeight: 0,
    }

    this.sliderTooltipFormatter = this.sliderTooltipFormatter.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleEventClick = this.handleEventClick.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.replayAdvance = this.replayAdvance.bind(this);
    this.handleLoweringReplayPause = this.handleLoweringReplayPause.bind(this);
    this.replayReverse = this.replayReverse.bind(this);
    this.updateEventFilter = this.updateEventFilter.bind(this)
    this.handleLoweringSelect = this.handleLoweringSelect.bind(this)
    this.handleLoweringModeSelect = this.handleLoweringModeSelect.bind(this)

  }

  componentDidMount() {

    if(!this.props.lowering.id || this.props.lowering.id != this.props.match.params.id || this.props.event.events.length == 0) {
      console.log("initLoweringReplay", this.props.match.params.id)
      this.props.initLoweringReplay(this.props.match.params.id, this.state.hideASNAP);
    }

    // if(!this.props.cruise.id || this.props.lowering.id != this.props.match.params.id){
    this.props.initCruiseFromLowering(this.props.match.params.id);
    // }
  }

  componentDidUpdate() {
    // if(this.state.mapHeight != this.mapPanel.clientHeight) {
    //   this.setState({mapHeight: this.mapPanel.clientHeight });
    // }
  }

  componentWillUnmount(){
    if(this.state.replayTimer) {
      clearInterval(this.state.replayTimer);
    }
  }

  updateEventFilter(filter = {}) {
    this.setState({ activePage: 1, replayEventIndex: 0 });
    this.handleLoweringReplayPause();
    this.props.updateEventFilterForm(filter);
    this.props.eventUpdateLoweringReplay(this.props.match.params.id, this.state.hideASNAP)
  }

  toggleASNAP() {
    this.props.eventUpdateLoweringReplay(this.props.lowering.id, !this.state.hideASNAP)
    this.handleLoweringReplayPause();
    this.setState( prevState => ({hideASNAP: !prevState.hideASNAP, activePage: 1, replayEventIndex: 0}))
  }

  fetchEventAuxData() {

    const cookies = new Cookies();
    let startTS = (this.props.event.eventFilter.startTS)? `startTS=${this.props.event.eventFilter.startTS}` : ''
    let stopTS = (this.props.event.eventFilter.stopTS)? `&stopTS=${this.props.event.eventFilter.stopTS}` : ''
    let value = (this.props.event.eventFilter.value)? `&value=${this.props.event.eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (this.props.event.eventFilter.author)? `&author=${this.props.event.eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (this.props.event.eventFilter.freetext)? `&freetext=${this.props.event.eventFilter.freetext}` : ''
    let datasource = (this.props.event.eventFilter.datasource)? `&datasource=${this.props.event.eventFilter.datasource}` : ''

    return axios.get(`${API_ROOT_URL}/api/v1/event_aux_data/bylowering/${this.props.lowering.id}?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        console.log(response)
        return response.data
      }).catch((error)=>{
        if(error.response.data.statusCode == 404){
          return []
        } else {
          console.log(error.response);
          return []
        }
      }
    );
  }

  fetchEventsWithAuxData(format = 'json') {

    const cookies = new Cookies();
    // console.log("event export update")
    format = `format=${format}`
    let startTS = (this.props.event.eventFilter.startTS)? `&startTS=${this.props.event.eventFilter.startTS}` : ''
    let stopTS = (this.props.event.eventFilter.stopTS)? `&stopTS=${this.props.event.eventFilter.stopTS}` : ''
    let value = (this.props.event.eventFilter.value)? `&value=${this.props.event.eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (this.props.event.eventFilter.author)? `&author=${this.props.event.eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (this.props.event.eventFilter.freetext)? `&freetext=${this.props.event.eventFilter.freetext}` : ''
    let datasource = (this.props.event.eventFilter.datasource)? `&datasource=${this.props.event.eventFilter.datasource}` : ''

    return axios.get(`${API_ROOT_URL}/api/v1/event_exports/bylowering/${this.props.lowering.id}?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        return response.data
      }).catch((error)=>{
        if(error.response.data.statusCode == 404){
          return []
        } else {
          console.log(error.response);
          return []
        }
      }
    );
  }

  fetchEvents(format = 'json') {

    const cookies = new Cookies();
    // console.log("event export update")
    format = `format=${format}`
    let startTS = (this.props.event.eventFilter.startTS)? `&startTS=${this.props.event.eventFilter.startTS}` : ''
    let stopTS = (this.props.event.eventFilter.stopTS)? `&stopTS=${this.props.event.eventFilter.stopTS}` : ''
    let value = (this.props.event.eventFilter.value)? `&value=${this.props.event.eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (this.props.event.eventFilter.author)? `&author=${this.props.event.eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (this.props.event.eventFilter.freetext)? `&freetext=${this.props.event.eventFilter.freetext}` : ''
    let datasource = (this.props.event.eventFilter.datasource)? `&datasource=${this.props.event.eventFilter.datasource}` : ''

    return axios.get(`${API_ROOT_URL}/api/v1/events/bylowering/${this.props.lowering.id}?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        return response.data
      }).catch((error)=>{
        if(error.response.data.statusCode == 404){
          return []
        } else {
          console.log(error.response);
          return []
        }
      }
    );
  }

  exportEventsWithAuxDataToCSV() {
    this.fetchEventsWithAuxData('csv').then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(results, `${prefix}.sealog_export.csv`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportEventsToCSV() {
    this.fetchEvents('csv').then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(results, `${prefix}.sealog_eventExport.csv`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportEventsWithAuxDataToJSON() {

    this.fetchEventsWithAuxData().then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_export.json`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportEventsToJSON() {

    this.fetchEvents().then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_eventExport.json`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportAuxDataToJSON() {

    this.fetchEventAuxData().then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_auxDataExport.json`);
    }).catch((error) => {
      console.log(error)
    })
  }

  sliderTooltipFormatter(v) {
    if(this.props.event.events.length > v) {
      let loweringStartTime = moment(this.props.lowering.start_ts)
      let loweringNow = moment(this.props.event.events[v].ts)
      let loweringElapse = loweringNow.diff(loweringStartTime)
      return moment.duration(loweringElapse).format("d [days] hh:mm:ss")
    }

    return ''
  }

  handleSliderChange(index) {
    this.handleLoweringReplayPause();
    if(this.props.event.events[index]) {
      this.setState({replayEventIndex: index})
      this.props.advanceLoweringReplayTo(this.props.event.events[index].id)
      this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)})
    }
  }

  handleEventClick(index) {
    this.handleLoweringReplayPause();
    if(this.props.event.events[index]) {
      this.setState({replayEventIndex: index})
      this.props.advanceLoweringReplayTo(this.props.event.events[index].id)
      this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)})
    }
  }

  handleImageClick(source, filepath) {
    this.handleLoweringReplayPause()
    this.props.showModal('imagePreview', { name: source, filepath: filepath })
  }

  handleEventCommentModal(index) {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: index})
    this.props.advanceLoweringReplayTo(this.props.event.events[index].id)
    this.props.showModal('eventComment', { event: this.props.event.events[index], handleUpdateEvent: this.props.updateEvent });
  }

  handlePageSelect(eventKey) {
    this.handleLoweringReplayPause();
    this.setState({activePage: eventKey, replayEventIndex: (eventKey-1)*maxEventsPerPage });
    this.props.advanceLoweringReplayTo(this.props.event.events[(eventKey-1)*maxEventsPerPage].id)
  }

  handleLoweringSelect(id) {
    this.props.gotoLoweringReplay(id)
    this.props.initLoweringReplay(id, this.state.hideASNAP);
    this.props.initCruiseFromLowering(id);
    this.setState({replayEventIndex: 0, activePage: 1})
  }

  handleLoweringModeSelect(mode) {
    if(mode === "Review") {
      this.props.gotoLoweringReview(this.props.match.params.id)
    } else if (mode === "Gallery") {
      this.props.gotoLoweringGallery(this.props.match.params.id)
    } else if (mode === "Replay") {
      this.props.gotoLoweringReplay(this.props.match.params.id)
    }
  }

  renderImage(source, filepath) {
    return (
      <Thumbnail onClick={ () => this.handleImageClick(source, filepath) } onError={this.handleMissingImage} src={filepath}>
        <div>{`${source}`}</div>
      </Thumbnail>
    )
  }

  handleMissingImage(ev) {
    ev.target.src = `${ROOT_PATH}images/noimage.jpeg`
  }

  handleLoweringReplayStart() {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: 0})
    this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id)
    this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)})
  }

  handleLoweringReplayEnd() {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: this.props.event.events.length-1})
    this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id)
    this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)})
  }

  handleLoweringReplayFRev() {
    this.setState({replayState: FREV})    
    if(this.state.replayTimer != null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayReverse, ffwdTimer)})
  }

  handleLoweringReplayPlay() {
    this.setState({replayState: PLAY})
    if(this.state.replayTimer != null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayAdvance, playTimer)})
  }

  handleLoweringReplayPause() {
    this.setState({replayState: PAUSE})
    if(this.state.replayTimer != null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: null})
  }

  handleLoweringReplayFFwd() {
    this.setState({replayState: FFWD})
    if(this.state.replayTimer != null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayAdvance, ffwdTimer)})

  }

  replayAdvance() {
    if(this.state.replayEventIndex < (this.props.event.events.length - 1)) {
      this.setState({replayEventIndex: this.state.replayEventIndex + 1})
      this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id)
      this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)})
    } else {
      this.setState({replayState: PAUSE})
    }
  }

  replayReverse() {
    if(this.state.replayEventIndex > 0) {
      this.setState({replayEventIndex: this.state.replayEventIndex - 1})
      this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id)
      this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)})
    } else {
      this.setState({replayState: PAUSE})
    }
  }

  renderImageryPanel() {
    if(this.props.event && this.props.event.selected_event.aux_data) {

      if (this.props.event.selected_event.event_value == "SulisCam") {
        let tmpData =[]

        for (let i = 0; i < this.props.event.selected_event.event_options.length; i++) {
          if (this.props.event.selected_event.event_options[i].event_option_name == "filename") {
            tmpData.push({source: "SulisCam", filepath: API_ROOT_URL + IMAGE_PATH + '/' + this.props.lowering.lowering_id +  '/SulisCam/' + this.props.event.selected_event.event_options[i].event_option_value} )
          } 
        }

        return (
          <Row>
            {
              tmpData.map((camera) => {
                return (
                  <Col key={camera.source} xs={12} sm={3} md={3} lg={3}>
                    {this.renderImage(camera.source, camera.filepath)}
                  </Col>
                )
              })
            }
          </Row>
        )
      } else {
        let frameGrabberData = this.props.event.selected_event.aux_data.filter(aux_data => aux_data.data_source == 'vehicleRealtimeFramegrabberData')
        let tmpData = []

        if(frameGrabberData.length > 0) {
          for (let i = 0; i < frameGrabberData[0].data_array.length; i+=2) {
      
            tmpData.push({source: frameGrabberData[0].data_array[i].data_value, filepath: API_ROOT_URL + IMAGE_PATH + frameGrabberData[0].data_array[i+1].data_value} )
          }

          return (
            <Row>
              {
                tmpData.map((camera) => {
                  return (
                    <Col key={camera.source} xs={12} sm={3} md={3} lg={3}>
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

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleRealtimeNavData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
      if(vehicleRealtimeNavData) {
        let xObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "latitude")
        realtime_latitude = (xObj)? `${xObj.data_value} ${xObj.data_uom}` : 'n/a'
        // delta_latitude = (xObj)? `${parseFloat(xObj.data_value)}` : delta_latitude

        let yObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "longitude")
        realtime_longitude = (yObj)? `${yObj.data_value} ${yObj.data_uom}` : 'n/a'
        // delta_longitude = (yObj)? `${parseFloat(yObj.data_value)}` : delta_longitude
      }
    }

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleReNavData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source == "vehicleReNavData")
      if(vehicleReNavData) {
        let xObj = vehicleReNavData.data_array.find(data => data.data_name == "latitude")
        renav_latitude = (xObj)? `${parseFloat(xObj.data_value).toFixed(6)} ${xObj.data_uom}` : 'n/a'
        delta_latitude = (xObj && realtime_latitude != 'n/a')? `${(parseFloat(realtime_latitude) - parseFloat(xObj.data_value)).toFixed(6)} ddeg` : 'n/a'

        let yObj = vehicleReNavData.data_array.find(data => data.data_name == "longitude")
        renav_longitude = (yObj)? `${parseFloat(yObj.data_value).toFixed(6)} ${yObj.data_uom}` : 'n/a'
        delta_longitude = (yObj && realtime_longitude != 'n/a')? `${(parseFloat(realtime_longitude) - parseFloat(yObj.data_value)).toFixed(6)} ddeg` : 'n/a'
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

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let alvinRealtimeAlvinCoordData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeAlvinCoordData")
      if(alvinRealtimeAlvinCoordData) {
        let xObj = alvinRealtimeAlvinCoordData.data_array.find(data => data.data_name == "alvin_x")
        realtime_alvin_x = (xObj)? `${xObj.data_value} ${xObj.data_uom}` : 'n/a'
        delta_alvin_x = (xObj)? `${parseFloat(xObj.data_value)}` : 'n/a'

        let yObj = alvinRealtimeAlvinCoordData.data_array.find(data => data.data_name == "alvin_y")
        realtime_alvin_y = (yObj)? `${yObj.data_value} ${yObj.data_uom}` : 'n/a'
        delta_alvin_y = (yObj)? `${parseFloat(yObj.data_value)}` : 'n/a'
      }
    }

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let alvinReNavAlvinCoordData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source == "vehicleReNavAlvinCoordData")
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

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleRealtimeNavData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
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

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleCTDData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeCTDData")
      if(vehicleCTDData) {
        let ctd_cObj = vehicleCTDData.data_array.find(data => data.data_name == "ctd_c")
        ctd_c = (ctd_cObj)? `${ctd_cObj.data_value} ${ctd_cObj.data_uom}` : 'n/a'

        let ctd_tObj = vehicleCTDData.data_array.find(data => data.data_name == "ctd_t")
        ctd_t = (ctd_tObj)? `${ctd_tObj.data_value} ${ctd_tObj.data_uom}` : 'n/a'

        let ctd_dObj = vehicleCTDData.data_array.find(data => data.data_name == "ctd_d")
        ctd_d = (ctd_dObj)? `${ctd_dObj.data_value} ${ctd_dObj.data_uom}` : 'n/a'
      }

      let vehicleTempProbeData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeTempProbeData")
      if(vehicleTempProbeData) {
        let temp_probeObj = vehicleTempProbeData.data_array.find(data => data.data_name == "ctd_c")
        temp_probe = (temp_probeObj)? `${temp_probeObj.data_value} ${temp_probeObj.data_uom}` : 'n/a'
      }

      let vehicleMagData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeMAGData")
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
            <Col sm={4} md={12}>
              <strong>CTD</strong><br/>
              <div style={{paddingLeft: "10px"}}>
                C:<span className="pull-right">{`${ctd_c}`}</span><br/>
                T:<span className="pull-right">{`${ctd_t}`}</span><br/>
                D:<span className="pull-right">{`${ctd_d}`}</span><br/>
              </div>
            </Col>
            <Col sm={4} md={12}>
              <strong>Temp Probe</strong><br/>
              <div style={{paddingLeft: "10px"}}>
                Temp:<span className="pull-right">{`${temp_probe}`}</span><br/>
              </div>
            </Col>
            <Col sm={4} md={12}>
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

  renderAuxDataPanel() {

    let return_aux_data = []
    if(this.props.event && this.props.event.selected_event.aux_data) {
      return this.props.event.selected_event.aux_data.map((aux_data, index) => {
        let return_data = aux_data.data_array.map((data, index) => {
          return (<div key={`${aux_data.data_source}_data_point_${index}`}><label>{data.data_name}:</label><span> {data.data_value} {data.data_uom}</span></div>)
        })
        return (
          <Col key={`${aux_data.data_source}`} xs={12} md={6}>
            <Panel>
              <label>{aux_data.data_source}:</label>
              <ul>
                {return_data}
                </ul>
            </Panel>
          </Col>
        )
      })
    }  

    return null
  }

  renderControlsPanel() {

    if(this.props.lowering && this.props.event.events) {
      let loweringStartTime = moment(this.props.lowering.start_ts)
      let loweringEndTime = moment(this.props.lowering.stop_ts)

      let loweringDuration = loweringEndTime.diff(loweringStartTime)
      
      let playPause = (this.state.replayState != 1)? <Link key={`pause_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayPause() }><FontAwesomeIcon icon="pause"/>{' '}</Link> : <Link key={`play_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayPlay() }><FontAwesomeIcon icon="play"/>{' '}</Link>;

      let buttons = (this.props.event.selected_event.ts && !this.props.event.fetching)? (
        <div className="text-center">
          <Link key={`start_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayStart() }><FontAwesomeIcon icon="step-backward"/>{' '}</Link>
          <Link key={`frev_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayFRev() }><FontAwesomeIcon icon="backward"/>{' '}</Link>
          {playPause}
          <Link key={`ffwd_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayFFwd() }><FontAwesomeIcon icon="forward"/>{' '}</Link>
          <Link key={`end_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayEnd() }><FontAwesomeIcon icon="step-forward"/>{' '}</Link>
        </div>
      ):(
        <div className="text-center">
          <FontAwesomeIcon icon="step-backward"/>{' '}
          <FontAwesomeIcon icon="backward"/>{' '}
          <FontAwesomeIcon icon="play"/>{' '}
          <FontAwesomeIcon icon="forward"/>{' '}
          <FontAwesomeIcon icon="step-forward"/>
        </div>
      )

      return (
        <Panel>
          <Panel.Body>
            <Row>
              <Col xs={4}>
                <span className="text-primary">00:00:00</span>
              </Col>
              <Col xs={4}>
                  {buttons}
              </Col>
              <Col xs={4}>
                <div className="pull-right">
                  <span className="text-primary">{moment.duration(loweringDuration).format("d [days] hh:mm:ss")}</span>
                </div>
              </Col>
            </Row>
            <SliderWithTooltip
              value={this.state.replayEventIndex}
              tipFormatter={this.sliderTooltipFormatter}
              trackStyle={{ opacity: 0.5 }}
              railStyle={{ opacity: 0.5 }}
              onBeforeChange={this.handleLoweringReplayPause}
              onChange={this.handleSliderChange}
              max={this.props.event.events.length-1}
            />
          </Panel.Body>
        </Panel>
      );
    }
  }

  renderEventListHeader() {

    const Label = "Filtered Events"
    const exportTooltip = (<Tooltip id="deleteTooltip">Export these events</Tooltip>)
    const toggleASNAPTooltip = (<Tooltip id="toggleASNAPTooltip">Show/Hide ASNAP Events</Tooltip>)

    const ASNAPToggleIcon = (this.state.hideASNAP)? "Show ASNAP" : "Hide ASNAP"
    const ASNAPToggle = (<Button disabled={this.props.event.fetching} bsSize="xs" onClick={() => this.toggleASNAP()}>{ASNAPToggleIcon}</Button>)

    return (
      <div>
        { Label }
        <ButtonToolbar className="pull-right" >
          {ASNAPToggle}
          <DropdownButton disabled={this.props.event.fetching} bsSize="xs" key={1} title={<OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon icon='download' fixedWidth/></OverlayTrigger>} id="export-dropdown" pullRight>
            <MenuItem key="toJSONHeader" eventKey={1.1} header>JSON format</MenuItem>
            <MenuItem key="toJSONAll" eventKey={1.2} onClick={ () => this.exportEventsWithAuxDataToJSON()}>Events w/aux data</MenuItem>
            <MenuItem key="toJSONEvents" eventKey={1.3} onClick={ () => this.exportEventsToJSON()}>Events Only</MenuItem>
            <MenuItem key="toJSONAuxData" eventKey={1.4} onClick={ () => this.exportAuxDataToJSON()}>Aux Data Only</MenuItem>
            <MenuItem divider />
            <MenuItem key="toCSVHeader" eventKey={1.5} header>CSV format</MenuItem>
            <MenuItem key="toCSVAll" eventKey={1.6} onClick={ () => this.exportEventsWithAuxDataToCSV()}>Events w/aux data</MenuItem>
            <MenuItem key="toCSVEvents" eventKey={1.6} onClick={ () => this.exportEventsToCSV()}>Events Only</MenuItem>
          </DropdownButton>
        </ButtonToolbar>
      </div>
    );
  }

  renderEventPanel() {
    return (
      <Panel>
        <Panel.Heading>{ this.renderEventListHeader() }</Panel.Heading>
        <ListGroup>
          {this.renderEvents()}
        </ListGroup>
      </Panel>
    );
  }

  renderEvents() {

    if(this.props.event.events && this.props.event.events.length > 0){

      let eventList = this.props.event.events.map((event, index) => {
        if(index >= (this.state.activePage-1) * maxEventsPerPage && index < (this.state.activePage * maxEventsPerPage)) {
          
          let comment_exists = false;

          let eventOptionsArray = event.event_options.reduce((filtered, option) => {
            if(option.event_option_name == 'event_comment') {
              comment_exists = (option.event_option_value !== '')? true : false;
            } else {
              filtered.push(`${option.event_option_name}: \"${option.event_option_value}\"`);
            }
            return filtered
          },[])
          
          if (event.event_free_text) {
            eventOptionsArray.push(`free_text: \"${event.event_free_text}\"`)
          } 

          let active = (this.props.event.selected_event.id == event.id)? true : false

          let eventOptions = (eventOptionsArray.length > 0)? '--> ' + eventOptionsArray.join(', '): ''
          
          let commentIcon = (comment_exists)? <FontAwesomeIcon onClick={() => this.handleEventCommentModal(index)} icon='comment' fixedWidth transform="grow-4"/> : <span onClick={() => this.handleEventCommentModal(index)} className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon icon='plus' fixedWidth inverse transform="shrink-4"/></span>
          let commentTooltip = (comment_exists)? (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>}>{commentIcon}</OverlayTrigger>) : (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>}>{commentIcon}</OverlayTrigger>)
          let eventComment = (this.props.roles.includes("event_logger") || this.props.roles.includes("admin"))? commentTooltip : null

          // eventArray.push(<ListGroupItem key={event.id}><Row><Col xs={11} onClick={() => this.handleEventShowDetailsModal(event)}>{event.ts} {`<${event.event_author}>`}: {event.event_value} {eventOptions}</Col><Col>{deleteTooltip} {commentTooltip} {seatubeTooltip} {youtubeTooltip} </Col></Row></ListGroupItem>);
          return (<ListGroupItem key={event.id} active={active} ><Row><Col xs={11} ><span onClick={() => this.handleEventClick(index)} >{`${event.ts} <${event.event_author}>: ${event.event_value} ${eventOptions}`}</span></Col><Col>{eventComment}</Col></Row></ListGroupItem>);

        }
      });

      return eventList
    }

    return (this.props.event.fetching)? (<ListGroupItem>Loading...</ListGroupItem>) : (<ListGroupItem>No events found</ListGroupItem>)
  }

  renderPagination() {

    if(!this.props.event.fetching && this.props.event.events.length > maxEventsPerPage) {
      let eventCount = this.props.event.events.length
      let last = Math.ceil(eventCount/maxEventsPerPage);
      let delta = 2
      let left = this.state.activePage - delta
      let right = this.state.activePage + delta + 1
      let range = []
      let rangeWithDots = []
      let l = null

      for (let i = 1; i <= last; i++) {
        if (i == 1 || i == last || i >= left && i < right) {
            range.push(i);
        }
      }

      for (let i of range) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(<Pagination.Item key={l + 1} active={(this.state.activePage === l+1)} onClick={() => this.handlePageSelect(l + 1)}>{l + 1}</Pagination.Item>)
          } else if (i - l !== 1) {
            rangeWithDots.push(<Pagination.Ellipsis key={`ellipsis_${i}`} />);
          }
        }
        rangeWithDots.push(<Pagination.Item key={i} active={(this.state.activePage === i)} onClick={() => this.handlePageSelect(i)}>{i}</Pagination.Item>);
        l = i;
      }

      return (
        <Pagination>
          <Pagination.First onClick={() => this.handlePageSelect(1)} />
          <Pagination.Prev onClick={() => { if(this.state.activePage > 1) { this.handlePageSelect(this.state.activePage-1)}}} />
          {rangeWithDots}
          <Pagination.Next onClick={() => { if(this.state.activePage < last) { this.handlePageSelect(this.state.activePage+1)}}} />
          <Pagination.Last onClick={() => this.handlePageSelect(last)} />
        </Pagination>
      )
    }
  }

  // renderPopoutMapButton() {
  //   return (
  //     <Link to="#" onClick={ () => this.openMapWindow() }><Button disabled={this.props.event.fetching}>Open Map Window</Button></Link>
  //   )  
  // }

  // openMapWindow() {

  //   let url = `${ROOT_PATH}/replay_map/${this.props.lowering.id}`
  //   let strWindowFeatures = "menubar=no,toolbar=no,location=no,width=640,height=780,resizable=yes,scrollbars=yes,status=yes";
  //   let win = window.open(url, '_blank', strWindowFeatures);
  //   win.focus();
  // }

  renderMapPanel() {

    // const mapRatio = (new Date(this.props.cruise.start_ts) <= new Date("2012-10-01"))? "embed-responsive-4by3" : "embed-responsive-16by9"
    const mapRatio = "embed-responsive-4by3"

    return (
      <Panel id="MapPanel" style={{backgroundColor: "#282828"}}>
        <Panel.Body style={{padding: "4px", marginBottom: "10px"}}>
          <div ref={ (mapPanel) => this.mapPanel = mapPanel} className={`embed-responsive ${mapRatio}`}>
            <LoweringReplayMap height={this.state.mapHeight} event={this.props.event.selected_event}/>
          </div>
          <div style={{marginTop: "8px", marginLeft: "10px"}}>Map</div>
        </Panel.Body>
      </Panel>
    )
  }

  render(){

    const cruise_id = (this.props.cruise.cruise_id)? this.props.cruise.cruise_id : "Loading..."
    const lowering_id = (this.props.lowering.lowering_id)? this.props.lowering.lowering_id : "Loading..."

    let gotoDropdown = (
      <DropdownButton id="dropdown-item-button" title="Replay">
        <MenuItem eventKey={1} >Review</MenuItem>
        <MenuItem eventKey={2} >Gallery</MenuItem>
      </DropdownButton>
    )

    return (
      <div>
        <ImagePreviewModal />
        <EventCommentModal />
        <Row>
          <Col lg={12}>
            <div style={{paddingBottom: "10px", paddingLeft: "10px"}}>
              <LinkContainer to={ `/` }>
                <span className="text-warning">{cruise_id}</span>
              </LinkContainer>
              {' '}/{' '}
              <LoweringDropdown onClick={this.handleLoweringSelect} active_cruise={this.props.cruise} active_lowering={this.props.lowering}/>
              {' '}/{' '}
              <LoweringModeDropdown onClick={this.handleLoweringModeSelect} active_mode={"Replay"} modes={["Review", "Gallery"]}/>
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            {this.renderImageryPanel()}
          </Col>
        </Row>
        <Row>
          <Col sm={4} md={3} lg={3}>
            {this.renderNavLatLonPanel()}
          </Col>
          <Col sm={4} md={3} lg={3}>
            {this.renderNavAlvCoordPanel()}
          </Col>
          <Col sm={4} md={3} lg={3}>
            {this.renderAttitudePanel()}
          </Col>
          <Col sm={8} md={3} lg={3}>
            {this.renderSensorPanel()}
          </Col>
        </Row>
        <Row>
          <Col md={9} lg={9}>
            {this.renderControlsPanel()}
            {this.renderEventPanel()}
            {this.renderPagination()}
          </Col>          
          <Col md={3} lg={3}>
            <EventFilterForm disabled={this.props.event.fetching} hideASNAP={this.state.hideASNAP} handlePostSubmit={ this.updateEventFilter } minDate={this.props.lowering.start_ts} maxDate={this.props.lowering.stop_ts}/>
          </Col>          
        </Row>
      </div>
    )
  }
}


        // <Row>
          // <Col lg={12}>
            // {this.renderPopoutMapButton()}
          // </Col>
        // </Row>

function mapStateToProps(state) {
  return {
    cruise: state.cruise.cruise,
    lowering: state.lowering.lowering,  
    roles: state.user.profile.roles,
    event: state.event
  }
}

export default connect(mapStateToProps, null)(LoweringReplay);
