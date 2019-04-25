// import { graphql } from 'gatsby';
import React, { Component } from 'react';
import { Dropdown, MenuItem } from 'react-bootstrap';
import RootCloseWrapper from 'react-overlays/RootCloseWrapper';
import PropTypes from 'prop-types';
// import axios from 'axios';
// import Cookies from 'universal-cookie';
// import { API_ROOT_URL } from '../client_config';

class LoweringModeDropdownToggle extends Component {
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
      <span className="text-primary" onClick={this.handleClick} onBlur={this.handleClick}>
        {this.props.children}
        <span className="caret"></span>
      </span>
    );
  }
}

class LoweringModeDropdownMenu extends Component {
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

class LoweringModeDropdown extends Component {

  constructor(props) {
    super(props);

    this.state = {
      menuItems: [],
      toggleText: "Loading..."
    }

    this.menuItemStyle = {paddingLeft: "10px"};
  }

  static propTypes = {
    active_mode: PropTypes.string.isRequired,
    modes: PropTypes.array.isRequired,
    onClick: PropTypes.func
  };

  componentDidMount() {}

  componentDidUpdate() {}

  componentWillReceiveProps() {
    this.setState(
      {
        toggleText: (this.props.active_mode)? this.props.active_mode : 'Loading...',
        menuItems: this.props.modes.map((mode, index) => (<MenuItem onClick={() => this.props.onClick(mode)} key={index} style={this.menuItemStyle} eventKey={index}>{mode}</MenuItem>))
      }
    )
  }

  render() {

    return (
      <Dropdown id="dropdown-custom-menu">
        <LoweringModeDropdownToggle bsRole="toggle">{this.state.toggleText}</LoweringModeDropdownToggle>
        <LoweringModeDropdownMenu style={this.dropdownMenuStyle} bsRole="menu">
          {this.state.menuItems}
        </LoweringModeDropdownMenu>
      </Dropdown>
    )
  };
}

export default LoweringModeDropdown;
