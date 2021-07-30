import React, { useEffect, useState, useCallback } from 'react';
import { _ } from 'alligator-client'
import Abortable from 'pull-abortable'
import { useModal } from "react-modal-hook";
import ReactModal from 'react-modal';
import { Formik, ErrorMessage, Field, Form, FieldArray } from 'formik';
import { faChevronUp, faChevronDown, faPlusCircle, faMinusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserPlus, faTrash, faWindowClose } from '@fortawesome/free-solid-svg-icons'
import Collapsible from 'react-collapsible';
import cuid from 'cuid';
import FSelect from './fselect'


function Groups({ connection, expanded }) {
  const [modalData, setModalData] = useState(null);
  const api = connection.peer

  const [showAdd, hideAdd] = useModal((...args) => (
    <ReactModal  ariaHideApp={false} appElement={document.getElementById('#root')} portalClassName="Modal" style={
      {
        overlay:
        {
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          zIndex: 1200
        },
        content: { left: expanded ? "240px" : "64px", maxWidth: "760px", border: "5px solid lightgray", margin: "0px auto", bottom: "auto" }

      }} isOpen onRequestClose={() => hideAdd()}>
      <h1 >Create a group</h1>

      <Formik
        initialValues={{ name: '', allow: '' }}
        enableReinitialize={true}
        validate={values => {
          console.log(values);
          let errors = {};
          if (!values) return errors;
          if (!values.name) {
            errors.name = 'Required';
          }
          
          return errors;
        }}
        onSubmit={(values, { setSubmitting, setErrors, isValid }) => {

          api.groups.put(_.isPlainObject(values) ? { name: values.name, allow: values.allow } : null, function (err) {
            if (err) {
              setErrors({ allow: err.message })
              setSubmitting(false);
              return false;
            }
            setSubmitting(false);
            hideAdd()
          });

        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit}>
            <div className="colgroup">

              <label htmlFor="name"> Name</label>
              <input
                type="text"
                name="name"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.name}
              />
            </div>
            <ErrorMessage name="name">{msg => <div className="error">{msg}</div>}</ErrorMessage>

            <div className="colgroup">

              <label htmlFor="allow">Allow </label>

              <textarea
                type="text"
                name="allow"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.allow}

              />
            </div>
            <ErrorMessage name="allow">{msg => <div className="error">{msg}</div>}</ErrorMessage>
            <button type="submit" disabled={isSubmitting}>Add</button>
          </form>
        )}
      </Formik>
      <button className="close" style={{
        fontSize: "2em",
        padding: 0,
        border: "none",
        cursor: "pointer",
        position: "absolute",
        top: "0px",
        right: "5px",
      }} onClick={hideAdd}> <FontAwesomeIcon icon={faWindowClose} /></button>
    </ReactModal>
  ), [modalData]);


  const openAddModal = showAdd
  const [showDel, hideDel] = useModal((...args) => (
    <ReactModal ariaHideApp={false} appElement={document.getElementById('#root')} portalClassName="Modal" style={
      {
        overlay:
        {
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          zIndex: 1200
        },
        content: { left: expanded ? "240px" : "64px", maxWidth: "760px", border: "5px solid lightgray", margin: "0px auto", bottom: "auto" }

      }} isOpen onRequestClose={() => hideDel()}>
      <h1 >Delete group </h1>

      <Formik
        initialValues={{ id: modalData.id, name: modalData.name, allow: modalData.allow ? JSON.stringify(modalData.allow) : '' }}
        validate={values => {
          let errors = {};
          if (!values.id) {
            errors.id = 'Required';
          }

          return errors;
        }}
        onSubmit={(values, { setSubmitting, setErrors, isValid }) => {
          api.groups.remove(values.id, function (err) {
            if (err) {
              setErrors({ allow: err.message })
              setSubmitting(false);
              return false;
            }
            setSubmitting(false);
            hideDel()
          });

        }}
      >
        {({
          values,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit}>
            <div className="colgroup">
              <h2>Are you sure you want to delete this group?</h2>
              <label htmlFor="id">Id</label>
              <input
                type="text"
                readOnly
                name="id"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.id}
              />


            </div>
            <ErrorMessage name="id">{msg => <div className="error">{msg}</div>}</ErrorMessage>
            <div className="colgroup">

              <label htmlFor="name"> Name</label>
              <input
                type="text"
                readOnly
                name="name"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.name}
              />

            </div>
            <ErrorMessage name="name">{msg => <div className="error">{msg}</div>}</ErrorMessage>
            <button type="submit" disabled={isSubmitting}>Delete</button>
          </form>
        )}
      </Formik>
      <button style={{
        fontSize: "2em",
        padding: 0,
        border: "none",
        cursor: "pointer",
        position: "absolute",
        top: "0px",
        right: "5px",
      }} className="close" onClick={hideDel}> <FontAwesomeIcon icon={faWindowClose} /></button>
    </ReactModal>
  ), [modalData]);


  const openDelModal = useCallback(data => {
    setModalData(data);
    showDel();
  });



  const [data, setData] = useState([])
  const [actions, setActions] = useState([])

  useEffect(() => {
    let abortable
    const abort = (err) => {
      if (abortable) {
        abortable.abort(err || true)
        abortable = null
      }
    }
    if (connection && connection.peer && connection.peer.addrs) {

      abortable = Abortable()

      _(connection.peer.addrs({ live: true, old: true }), abortable, _.drain((item) => {

        if (!_.isPlainObject(item)) return
        const index = actions.findIndex((ele) => ele.action === item.action)
        if (index === -1) {
          actions.push({ index: cuid(), ...item })
          setActions([...actions])
          return
        }

        if (actions[index].ts < item.ts) {

          item.index = actions[index].index
          actions[index] = item
          setActions([...actions])
        }

      }, abort))

      return abort
    }
  }, [connection])

  useEffect(() => {
    let abortable
    let abortable2

    if (api.groups && api.groups.ls) {
      abortable = Abortable()
      abortable2 = Abortable()


      _(api.groups.ls({ live: true, old: true }), abortable, _.drain((item) => {
        if (!_.isPlainObject(item)) return
        const index = data.findIndex((ele) => ele.id === item.id)

        if (index === -1) {
          data.push(item)
          setData([...data].filter((item) => item.delete !== true))
          return
        }

        if (data[index].ts < item.ts) {
          data[index] = item
          setData([...data].filter((item) => item.delete !== true))
        }


      }, () => {
        abortable = null
      }))
    }

    return () => {
      if (abortable) abortable.abort(true)
      if (abortable2) abortable2.abort(true)

    }
  }, [connection])

  let trigger = (open, item, index) => {

    return (<div key={"group_collapse_trigger_" + item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      {item.name ? (<div>{item.name}<small> ID:{item.id}</small></div>) : item.id} <div>
        <button onClick={(e) => {
           e.preventDefault();
           e.stopPropagation();
          openDelModal(item)
          }}> <FontAwesomeIcon icon={faTrash} /></button>
        <button><FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} /></button></div>
    </div>)
  }

  return (<div className="groups">

    <h2>Groups</h2>
    <button className="add" onClick={openAddModal}><FontAwesomeIcon icon={faUserPlus} /> Add group</button>
    {data.map((group, index) =>

      <Collapsible
        key={`group_${group.id}}`} classParentString="group"
        trigger={trigger(false, group, index)} triggerWhenOpen={trigger(true, group, index)}
      >
        <Formik enableReinitialize={true}
          initialValues={{ id: group.id, name: group.name, allow: group.allow, ts: group.ts }}
          validate={values => {
            let errors = {};
            if (!values.id) {
              errors.id = 'Required';
            }
            if (!values.name) {
              errors.name = 'Required';
            }


            //  errors.email = 'Invalid email address';

            return errors;
          }}
          onSubmit={(values, { setSubmitting, setErrors, isValid }) => {
            console.log("submit");
            api.groups.put({ id: values.id, name: values.name, allow: values.allow }, function (err, data) {
              if (err) {
                setErrors({ allow: err.message })
                setSubmitting(false);
                return false;
              }
              setSubmitting(false);
            });

          }}
        >
          {({
            values,
            handleChange,
            handleBlur,
            isSubmitting,
            /* and other goodies */
          }) => (
            <Form>
              <div className="colgroup">

                <label htmlFor="id"> Id </label>
                <Field
                  type="text"
                  readOnly
                  name="id"

                  value={values.id}
                />

              </div>
              <ErrorMessage name="id">{msg => <div className="error">{msg}</div>}</ErrorMessage>
              <div className="colgroup">

                <label htmlFor="ts"> Last modified </label>
                <Field
                  type="text"
                  readOnly
                  name="ts"

                  value={new Date(values.ts).toLocaleString()}
                />

              </div>
              <ErrorMessage name="ts">{msg => <div className="error">{msg}</div>}</ErrorMessage>


              <div className="colgroup">

                <label htmlFor="name"> Name </label>
                <Field
                  type="text"
                  name="name"
                  value={values.name}
                />

              </div>
              <ErrorMessage name="name">{msg => <div className="error">{msg}</div>}</ErrorMessage>


              <div className="colgroup">

                <label htmlFor="allow">Allow </label>

                <FieldArray
                  name="allow"
                  render={arrayHelpers => (
                    <div key={"group_allow_" + group.id}>
                      {values.allow.map((allow, index) => (
                        <div key={"allow" + group.id + index}>
                          <div className="addbar"><Field readOnly name={`allow[${index}]`} />
                            <button type="button" onClick={() => arrayHelpers.remove(index)}>
                            <FontAwesomeIcon icon={faMinusCircle}></FontAwesomeIcon>
                            </button>

                          </div>

                        </div>
                      ))}
                      <div key={"allow_addbar" + index} className="addbar">
                        {/** both these conventions do the same */}
                        <label>Function:</label>
                        <FSelect isSearchable={false} className="select-container"
                          classNamePrefix="select" key={"allow_value_" + index} name={"allow_value_" + index} options={actions.reduce((a, b) => {
                            a.push({ label: b.action, value: b.action })
                           
                            return a
                          }, [{ label: "all", value: "*" }])} />

                        <button
                          type="button"
                          onClick={() => arrayHelpers.push(values["allow_value_" + index] || "")}
                        >
                             <FontAwesomeIcon icon={faPlusCircle}></FontAwesomeIcon>
                      </button>
                      </div>
                    </div>
                  )}
                />

              </div>

              <ErrorMessage name="allow">{msg => <div className="error">{msg}</div>}</ErrorMessage>
              <button type="submit" disabled={isSubmitting}>Save</button>
            </Form>
          )}
        </Formik>

      </Collapsible>
    )}


  </div>)
}


export default Groups