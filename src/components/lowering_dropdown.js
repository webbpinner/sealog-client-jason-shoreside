// import { graphql } from 'gatsby';
import React, { Component } from 'react';
import { Dropdown, MenuItem } from 'react-bootstrap';
import RootCloseWrapper from 'react-overlays/RootCloseWrapper';
import PropTypes from 'prop-types';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { API_ROOT_URL } from '../client_config';

const cookies = new Cookies();

class LoweringDropdownToggle extends Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();

    this.props.onClick(e);
  }

  render() {
    return (
      <span className="text-warning" onClick={this.handleClick} onBlur={this.handleClick}>
        {this.props.children}
        <span className="caret"></span>
      </span>
    );
  }
}

class LoweringDropdownMenu extends Component {
  constructor(props) {
    super(props);

    this.handleRootClose = this.handleRootClose.bind(this);

  }

  handleRootClose(event) {
    this.props.onClose(event, { source: 'rootClose' });
  }

  render() {
    const { children, rootCloseEvent, open } = this.props;

    return (
      <RootCloseWrapper
        disabled={!open}
        onRootClose={this.handleRootClose}
        event={rootCloseEvent}
      >
        <div className="dropdown-menu" style={{ padding: '', minWidth: '100px' }}>
          <ul className="list-unstyled">
            {children}
          </ul>
        </div>
      </RootCloseWrapper>
    );
  }
}

class LoweringDropdown extends Component {

  constructor(props) {
    super(props);

    this.state = {
      menuItems: [],
      toggleText: "Loading...",
      cruise: {}
    }

    this.menuItemStyle = {paddingLeft: "10px"};

    this.getLowerings = this.getLowerings.bind(this);

  }

  static propTypes = {
    active_cruise: PropTypes.object.isRequired,
    active_lowering: PropTypes.object.isRequired,
    onClick: PropTypes.func
  };

  componentDidMount() {}

  componentDidUpdate() {

    if(this.state.cruise && this.props.active_cruise && this.state.cruise.id != this.props.active_cruise.id) {
      this.getLowerings(this.props.active_cruise, this.props.onClick)
    }
  }

  componentWillReceiveProps() {
    this.setState({toggleText: (this.props.active_lowering.lowering_id)? this.props.active_lowering.lowering_id : 'Loading...'})

    if(this.props.active_cruise && this.props.active_cruise.cruise_id != this.state.cruise.cruise_id) {
      this.getLowerings(this.props.active_cruise, this.props.onClick)
    }
  }

  async getLowerings(cruise, onClick) {

    try {
      const response = await axios.get(`${API_ROOT_URL}/api/v1/lowerings?startTS=${cruise.start_ts}&stopTS=${cruise.stop_ts}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      })
      
      const lowerings = await response.data;
      this.setState({cruise, menuItems: lowerings.map((lowering, index) => (<MenuItem onClick={() => onClick(lowering.id)} key={lowering.id} style={this.menuItemStyle} eventKey={index}>{lowering.lowering_id}</MenuItem>))})
    }
    catch(error){
      console.log(error)
    }
  }

  render() {

    return (
      <Dropdown id="dropdown-custom-menu">
        <LoweringDropdownToggle bsRole="toggle">{this.state.toggleText}</LoweringDropdownToggle>
        <LoweringDropdownMenu style={this.dropdownMenuStyle} bsRole="menu">
          {this.state.menuItems}
        </LoweringDropdownMenu>
      </Dropdown>
    )
  };
}

export default LoweringDropdown;
