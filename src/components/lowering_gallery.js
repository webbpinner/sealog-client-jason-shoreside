import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import moment from 'moment';
import { connect } from 'react-redux';
import Cookies from 'universal-cookie';
import { Button, Row, Col, Panel, ListGroup, ListGroupItem, ButtonToolbar, DropdownButton, Pagination, MenuItem, Tooltip, Tabs, Tab, OverlayTrigger, Well, Thumbnail } from 'react-bootstrap';
import axios from 'axios';
import EventFilterForm from './event_filter_form';
import EventCommentModal from './event_comment_modal';
import EventShowDetailsModal from './event_show_details_modal';
import LoweringGalleryTab from './lowering_gallery_tab';
import LoweringDropdown from './lowering_dropdown';
import LoweringModeDropdown from './lowering_mode_dropdown';
import * as actions from '../actions';
import { ROOT_PATH, API_ROOT_URL, IMAGE_PATH } from '../client_config';

let fileDownload = require('js-file-download');

const dateFormat = "YYYYMMDD"
const timeFormat = "HHmm"

const cookies = new Cookies();

const maxEventsPerPage = 15

class LoweringGallery extends Component {

  constructor (props) {
    super(props);

    this.state = {
      fetching: false,
      aux_data: []
    }

    this.handleLoweringSelect = this.handleLoweringSelect.bind(this)
    this.handleLoweringModeSelect = this.handleLoweringModeSelect.bind(this)

  }

  componentDidMount() {
    this.initLoweringImages(this.props.match.params.id);

    if(!this.props.lowering.id || this.props.lowering.id != this.props.match.params.id || this.props.event.events.length == 0) {
      this.props.initLowering(this.props.match.params.id);
    }

    if(!this.props.cruise.id || this.props.lowering.id != this.props.match.params.id){
      this.props.initCruiseFromLowering(this.props.match.params.id);
    }
  }

  componentDidUpdate() {
  }

  componentWillUnmount(){
  }

  initLoweringImages(id, auxDatasourceFilter = 'vehicleRealtimeFramegrabberData') {
    this.setState({ fetching: true})

    let url = `${API_ROOT_URL}/api/v1/event_aux_data/bylowering/${id}?datasource=${auxDatasourceFilter}`
    axios.get(url,
    {
      headers: {
        authorization: cookies.get('token')
      }
    }).then((response) => {

      let image_data = {}
      response.data.forEach((data) => {
        let tmpData = []
        for (let i = 0; i < data.data_array.length; i+=2) {
          if(!(data.data_array[i].data_value in image_data)){
            // console.log("adding image source:", data.data_array[i].data_value)
            image_data[data.data_array[i].data_value] = { images: [] }
          }

          // console.log("adding image", data.data_array[i+1].data_value, "to source", data.data_array[i].data_value)
          image_data[data.data_array[i].data_value].images.unshift({ event_id: data.event_id, filepath: API_ROOT_URL + IMAGE_PATH + data.data_array[i+1].data_value })
        }
      })

      this.setState({ aux_data: image_data, fetching: false })
    }).catch((error)=>{
      // if(error.response.data.statusCode !== 404) {
        // this.setState({ aux_data: null, fetching: false })
      // }
      console.log(error)
    })
  }

  handleLoweringSelect(id) {
    this.props.gotoLoweringGallery(id)
    this.props.initLowering(id, this.state.hideASNAP);
    this.props.initCruiseFromLowering(id);
    this.initLoweringImages(id);

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

  renderGalleries() {

    let galleries = []
    for (const [key, value] of Object.entries(this.state.aux_data)) {
      galleries.push((
        <Tab key={`tab_${key}`} eventKey={`tab_${key}`} title={key}>
          <LoweringGalleryTab imagesSource={key} imagesData={value}/>
        </Tab>

      ))
    }

    return (
      <Tabs id="galleries">
        <br/>
        { galleries }
      </Tabs>
    )
  }

  render(){

    let cruise_id = (this.props.cruise.cruise_id)? this.props.cruise.cruise_id : "loading..."
    let lowering_id = (this.props.lowering.lowering_id)? this.props.lowering.lowering_id : "loading..."
    return (
      <div>
        <EventCommentModal />
        <EventShowDetailsModal />
        <Row>
          <Col lg={12}>
            <div style={{paddingBottom: "10px", paddingLeft: "10px"}}>
              <LinkContainer to={ `/` }>
                <span className="text-warning">{cruise_id}</span>
              </LinkContainer>
              {' '}/{' '}
              <LoweringDropdown onClick={this.handleLoweringSelect} active_cruise={this.props.cruise} active_lowering={this.props.lowering}/>
              {' '}/{' '}
              <LoweringModeDropdown onClick={this.handleLoweringModeSelect} active_mode={"Gallery"} modes={["Replay", "Review"]}/>
            </div>
          </Col>
          <Col lg={12}>
            {this.renderGalleries()}
          </Col>
        </Row>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    roles: state.user.profile.roles,
    event: state.event,
    cruise: state.cruise.cruise,
    lowering: state.lowering.lowering
  }
}

export default connect(mapStateToProps, null)(LoweringGallery);