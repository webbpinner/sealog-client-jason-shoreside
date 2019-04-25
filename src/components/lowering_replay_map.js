import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { connect } from 'react-redux';
import { Button, Row, Col, Grid, Panel, Accordion, Pagination, ListGroup, ListGroupItem, MenuItem, Thumbnail, Well, OverlayTrigger, Tooltip, ButtonToolbar, DropdownButton } from 'react-bootstrap';
import * as actions from '../actions';
// import { ROOT_PATH, API_ROOT_URL, IMAGE_PATH } from '../client_config';

class LoweringReplayMap extends Component {

  constructor (props) {
    super(props);

    this.state = {
      zoom: 6,
      position:{lat:0, lng:0},
      showMarker: false,
      height: 0
    }

    this.calcVehiclePosition = this.calcVehiclePosition.bind(this);
    this.handleZoomEnd = this.handleZoomEnd.bind(this);
  }

  static propTypes = {
    height: PropTypes.number.isRequired,
    event: PropTypes.object.isRequired
  };


  componentDidMount() {
  }

  componentDidUpdate() {
    this.calcVehiclePosition(this.props.event)
    this.map.leafletElement.invalidateSize()
  
    if(this.props.height != this.state.height) {
      // console.log("height change from", this.state.height, "to", this.props.height)
      this.setState({height: this.props.height})
    }
  }

  componentWillUnmount(){}

  handleZoomEnd() {
    this.setState({zoom: this.map.leafletElement.getZoom()});
  }

  calcVehiclePosition(selected_event) {
    if(selected_event && selected_event.aux_data) {
      let vehicleRealtimeNavData = selected_event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
      if(vehicleRealtimeNavData) {
        let latObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "latitude")
        let lonObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "longitude")

        if(latObj && lonObj && latObj.data_value != this.state.position.lat && lonObj.data_value != this.state.position.lng) {
          this.setState({ showMarker: true, position:{ lat:latObj.data_value, lng: lonObj.data_value}})
        } else if(!latObj || !lonObj) {
          this.setState({showMarker: false})
        }
      }
    }
  }

  render() {
    const marker = (this.state.showMarker)? (
      <Marker position={this.state.position}>
        <Popup>
          You are here! :-)
        </Popup>
      </Marker>
    ) : null

    // Esri Ocean Layer
    // maxZoom={13}
    // <TileLayer
    //   attribution='Tiles &copy; Esri'
    //   url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}"
    // />

    // OpenStreetMap
    // <TileLayer
    //   attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    //   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    // />

    return (
      <Map
        style={{ height: this.state.height }}
        center={this.state.position}
        zoom={this.state.zoom}
        maxZoom={10}
        onZoomEnd={this.handleZoomEnd}
        ref={ (map) => this.map = map}
      >
        <TileLayer
          attribution='Tiles &copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}"
          maxZoom={10}
        />
        {marker}
      </Map>
    )
  }
}

function mapStateToProps(state) {
  return {}
}

export default connect(mapStateToProps, null)(LoweringReplayMap);
