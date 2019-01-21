import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'react-bootstrap';
import { Client } from 'nes/client';
import { WS_ROOT_URL } from '../url_config';

import * as actions from '../actions';

class Footer extends Component {

  constructor (props) {
    super(props);

    this.handleASNAPNotification = this.handleASNAPNotification.bind(this);
    this.client = new Client(`${WS_ROOT_URL}`);
    this.connectToWS = this.connectToWS.bind(this);

  }

  componentWillMount() {
  }

  componentDidMount() {
    this.handleASNAPNotification()
    this.connectToWS();
  }

  componentWillUnmount() {
  }

  async connectToWS() {

    try {
      const result = await this.client.connect()
      // {
      //   auth: {
      //     headers: {
      //       authorization: cookies.get('token')
      //     }
      //   }
      // })

      const updateHandler = (update, flags) => {
        console.log("update:", update)
        this.handleASNAPNotification()
      }

      this.client.subscribe('/ws/status/updateCustomVar', updateHandler);

    } catch(error) {
      console.log(error);
      throw(error)
    }
  }


  handleASNAPNotification() {
    if(this.props.authenticated) {
      this.props.fetchCustomVars()
    }
  }

  render () {

    let asnapStatus = null

    if(this.props.authenticated && this.props.asnapStatus && this.props.asnapStatus == "Off") {
      asnapStatus =  (
        <span>
          ASNAP: <span className="text-danger">Off</span>
        </span>
      )
    } else if(this.props.authenticated && this.props.asnapStatus && this.props.asnapStatus == "On") {
      asnapStatus =  (
        <span>
          ASNAP: <span className="text-success">On</span>
        </span>
      )
    } else if(this.props.authenticated) {
      asnapStatus =  (
        <span>
          ASNAP: <span className="text-warning">Unknown</span>
        </span>
      )
    }

    return (
      <div>
        <hr/>
        <div>
          {asnapStatus}
          <span className="pull-right">
            <a href={`/github`} target="_blank">Sealog</a> is licensed under the <a href={`/license`} target="_blank">GPLv3</a> public license
          </span>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state){

  let asnapStatus = (state.custom_var)? state.custom_var.custom_vars.find(custom_var => custom_var.custom_var_name == "asnapStatus") : null

  return {
    asnapStatus: (asnapStatus)? asnapStatus.custom_var_value : "Unknown",
    authenticated: state.auth.authenticated,

  }
}

export default connect(mapStateToProps, actions)(Footer);
