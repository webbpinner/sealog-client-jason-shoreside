import React, { Component } from 'react';
import { reduxForm, Field } from 'redux-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Grid, Row, Col, FormGroup, Checkbox, Panel, Button, Alert, Image } from 'react-bootstrap';
import ReCAPTCHA from "react-google-recaptcha";
import * as actions from '../../actions';
import { ROOT_PATH, RECAPTCHA_SITE_KEY } from '../../url_config';

class ForgotPassword extends Component {
 
 constructor (props) {
    super(props);

    this.state = { 
      reCaptcha: null
    }
  }

  componentWillUnmount() {
    this.props.leaveLoginForm();
  }

  handleFormSubmit({ email }) {
    let reCaptcha = this.state.reCaptcha
    this.props.forgotPassword({email, reCaptcha});
  }

  onCaptchaChange(token) {
    this.setState({reCaptcha: token})
  }

  renderAlert(){
    if(this.props.errorMessage) {
      return (
        <Alert bsStyle="danger">
          <strong>Opps!</strong> {this.props.errorMessage}
        </Alert>
      )
    } else if (this.props.successMessage) {
      return (
        <Alert bsStyle="success">
          <strong>Sweet!</strong> {this.props.successMessage}
        </Alert>
      )
    }
  }

  renderCheckbox({ input, label, meta: { dirty, error, warning } }) {    

    return (
      <FormGroup>
        <Checkbox
          checked={input.value ? true : false}
          onChange={(e) => input.onChange(e.target.checked)}
        >
          {label}
        </Checkbox>
        {(error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>)}
      </FormGroup>
    );
  }
 
render() {
    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const loginPanelHeader = (<h4 className="form-signin-heading">Forgot Password</h4>);

    return (
      <Grid>
        <Row>
          <Col>
            <Panel className="form-signin" >
              <Panel.Body>
                {loginPanelHeader}
                <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
                  <FormGroup>
                    <Field
                      name="email"
                      component="input"
                      type="text"
                      placeholder="Email Address"
                      className="form-control"
                    />
                  </FormGroup>
                  <ReCAPTCHA
                    ref={e => recaptchaInstance = e}
                    sitekey={RECAPTCHA_SITE_KEY}
                    theme="dark"
                    size="normal"
                    onChange={this.onCaptchaChange.bind(this)}
                  />
                  <br/>
                  {this.renderAlert()}
                  <div>
                    <Button bsStyle="primary" type="submit" block disabled={submitting || !valid || !this.state.reCaptcha}>Submit</Button>
                  </div>
                </form>
                <br/>
                <div>
                  <span className="pull-right">
                    <Link to={ `/login` }>Back to Login {<FontAwesomeIcon icon="arrow-right"/>}</Link>
                  </span>
                </div>
              </Panel.Body>
            </Panel>
          </Col>
        </Row>
      </Grid>
    )
  }
}
                // <br/>
                // <GoogleForgotPassword
                  // clientId="77038833971-sfa3169t4v2dmse0d0iv87d82i51mtsi.apps.googleusercontent.com"
                  // onSuccess={this.responseGoogle}
                  // onFailure={this.responseGoogle}
                // />


                  // <FormGroup>
                    // <Field
                      // name="remember_user"
                      // label="Remember Me?"
                      // component={this.renderCheckbox}
                    // />
                  // </FormGroup>

const validate = values => {

  // console.log(values)
  const errors = {}
  if (!values.email) {
    errors.email = 'Required'
  }

  return errors
}

function mapStateToProps(state) {
  return {
    errorMessage: state.auth.error,
    successMessage: state.auth.message
  }
}

let recaptchaInstance = null;

const afterSubmit = (result, dispatch) => {
  recaptchaInstance.reset();
}

ForgotPassword = reduxForm({
  form: 'forgotPassword',
  validate: validate,
  onSubmitSuccess: afterSubmit
})(ForgotPassword);

export default connect(mapStateToProps, actions)(ForgotPassword);
