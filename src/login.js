import { Formik, Form, Field, ErrorMessage } from 'formik';
import util from "icebreaker-network/lib/util"

function Login(props) {

  const id = util.encode(props.peerInfo.keys.publicKey, props.peerInfo.encoding);

  return (<div className="Login">
    <img alt="Alligator Island"  className="logo" src="./logo.png" />
    <h1>Alligator Island</h1>

    <Formik
      initialValues={{ id, url: localStorage.getItem('serverUrl') || "" }}
      validate={values => {
        const errors = {};
        if (!values.id) errors.id = 'Required';
        if (!values.url) errors.url = 'Required'
        else if (!/^(shs\+ws:\/\/)+(?:\w+@)+(?:\S+)$/.test(values.url)) errors.url = "Invalid Alligator address";

        return errors;
      }}
      onSubmit={(values, { setSubmitting, setErrors }) => {
        localStorage.setItem("serverUrl", values.url);
        if (props.onSubmit) props.onSubmit(values, { setSubmitting, setErrors })
      }}
    >
      {({ isSubmitting }) => (
        <Form className="form">
          <label htmlFor="id">Your ID:</label>
          <Field type="text" name="id" readOnly />
          <ErrorMessage name="email" component="div" className="error" />
          <label htmlFor="url">Server URL*:</label>
          <Field type="url" name="url" />
          <ErrorMessage name="url" component="div" className="error" />
          <small>Add your identity on server with command:<br /><pre>
            <code>
              alligator friends.put {id}
            </code>
          </pre></small>
          <button type="submit" disabled={isSubmitting}>
            Connect
            </button>
        </Form>
      )}
    </Formik>

  </div>)
}
export default Login