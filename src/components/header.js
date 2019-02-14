import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Navbar, Nav, NavDropdown, NavItem, MenuItem, Image } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { ROOT_PATH, HEADER_TITLE } from '../client_config';
import * as actions from '../actions';

class Header extends Component {

  constructor (props) {
    super(props);
  }

  componentWillMount() {
    if (this.props.authenticated) {
      this.props.updateProfileState();
    }
  }

  handleASNAPToggle() {
    if(this.props.asnapStatus) {
      if(this.props.asnapStatus.custom_var_value == 'Off') {
        this.props.updateCustomVars(this.props.asnapStatus.id, {custom_var_value: 'On'})
      } else {
        this.props.updateCustomVars(this.props.asnapStatus.id, {custom_var_value: 'Off'})
      }
    }
  }

  renderUserOptions() {
    if(this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager')) {
      return (
        <LinkContainer to={ `/users` }>
          <NavItem>Users</NavItem>
        </LinkContainer>
      );
    }
  }

  renderEventLoggingOptions() {
    if(this.props.authenticated) {
      return (
        <LinkContainer to={ `/cruise_menu` }>
          <NavItem>Review Cruises/Lowerings</NavItem>
        </LinkContainer>
      );
    }
  }

  renderEventManagementOptions() {
    if(this.props.roles.includes('admin')) {
      return (
        <LinkContainer to={ `/event_management` }>
          <NavItem>Event Management</NavItem>
        </LinkContainer>
      );
    }
  }

  renderEventTemplateOptions() {
    if(this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') || this.props.roles.includes('event_manager')) {
      return (
        <LinkContainer to={ `/event_templates` }>
          <NavItem>Event Templates</NavItem>
        </LinkContainer>
      );
    }
  }

  renderLoweringOptions() {
    if(this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager')) {
      return (
        <LinkContainer to={ `/lowerings` }>
          <NavItem>Lowerings</NavItem>
        </LinkContainer>
      );
    }
  }

  renderCruiseOptions() {
    if(this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager')) {
      return (
        <LinkContainer to={ `/cruises` }>
          <NavItem>Cruises</NavItem>
        </LinkContainer>
      );
    }
  }

  renderTaskOptions() {
    if(this.props.roles.includes('admin')) {
      return (
        <LinkContainer to={ `/tasks` }>
          <MenuItem>Tasks</MenuItem>
        </LinkContainer>
      );
    }
  }

  renderToggleASNAP() {
    if(this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') || this.props.roles.includes('event_manager') || this.props.roles.includes('event_logger')) {
      return (
        <MenuItem onClick={ () => this.handleASNAPToggle() }>Toggle ASNAP</MenuItem>
      );
    }
  }

  renderSystemManagerDropdown() {
    if(this.props.roles && (this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') || this.props.roles.includes('event_manager'))) {
      return (
        <NavDropdown eventKey={3} title={'System Management'} id="basic-nav-dropdown">
          {this.renderCruiseOptions()}
          {this.renderEventManagementOptions()}
          {this.renderLoweringOptions()}
          {this.renderTaskOptions()}
          {this.renderUserOptions()}
        </NavDropdown>
      );
    }
  }
          // {this.renderEventTemplateOptions()}
          // {this.renderToggleASNAP()}

  renderUserDropdown() {
    if(this.props.authenticated){
      return (
      <NavDropdown eventKey={3} title={<span>{this.props.fullname} <FontAwesomeIcon icon="user" /></span>} id="basic-nav-dropdown">
        <LinkContainer to={ `/profile` }>
          <MenuItem key="profile" eventKey={3.1} >User Profile</MenuItem>
        </LinkContainer>
        <MenuItem key="logout" eventKey={3.3} onClick={ () => this.handleLogout() } >Log Out</MenuItem>
      </NavDropdown>
      );
    }
  }
        // {(this.props.fullname != 'Guest')? (<MenuItem key="switch2Guest" eventKey={3.1} onClick={ () => this.handleSwitchToGuest() } >Switch to Guest</MenuItem>) : null }

  handleLogout() {
    this.props.logout();
  }

  // handleSwitchToGuest() {
  //   this.props.switch2Guest();
  // }

  // handleSwitchToPilot() {
  //   this.props.switch2Pilot();
  // }

  // handleSwitchToStbdObs() {
  //   this.props.switch2StbdObs();
  // }

  // handleSwitchToPortObs() {
  //   this.props.switch2PortObs();
  // }

  render () {
    return (
      <Navbar fluid collapseOnSelect>
        <Navbar.Header>
          <Navbar.Brand>
            <Link to={ `/` }>{HEADER_TITLE}</Link>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav pullRight>
            {this.renderEventLoggingOptions()}
            {this.renderSystemManagerDropdown()}
            {this.renderUserDropdown()}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

function mapStateToProps(state){
  // let asnapStatus = (state.custom_var)? state.custom_var.custom_vars.find(custom_var => custom_var.custom_var_name == "asnapStatus") : null

  return {
    authenticated: state.auth.authenticated,
    fullname: state.user.profile.fullname,
    roles: state.user.profile.roles,
    // asnapStatus: (state.custom_var)? state.custom_var.custom_vars.find(custom_var => custom_var.custom_var_name == "asnapStatus") : null
  };
}

export default connect(mapStateToProps, actions)(Header);
