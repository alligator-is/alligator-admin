import React, { useEffect, useState, useCallback } from 'react';
import { _ } from 'alligator-client'
import Abortable from 'pull-abortable'
import { useModal } from "react-modal-hook";
import ReactModal from 'react-modal';
import { Formik, ErrorMessage, Field, FieldArray, Form } from 'formik';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faWindowClose, faChevronUp, faChevronDown, faUserPlus, faPlusCircle, faMinusCircle } from '@fortawesome/free-solid-svg-icons'
import Collapsible from 'react-collapsible';
import FSelect from './fselect';
const unflatten = require('flat').unflatten;
const flatten = require('flat').flatten;
function Identitites({ connection, expanded }) {
  const api = connection.peer
  const [modalData, setModalData] = useState(null);

  const [showAdd, hideAdd] = useModal((...args) => (
    <ReactModal appElement={document.getElementById('#root')} portalClassName="Modal" ariaHideApp={false} style={
      {
        overlay:
        {
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          zIndex: 1200
        },
        content: { left: expanded ? "240px" : "64px", maxWidth: "760px", border: "5px solid lightgray", margin: "0px auto", bottom: "auto" }

      }} isOpen onRequestClose={() => hideAdd()}>
      <h1 >Add identity </h1>

      <Formik
        initialValues={{ id: '', name: '' }}
        validate={values => {
          let errors = {};
          if (!values.id) {
            errors.id = 'Required';
          }


          return errors;
        }}
        onSubmit={(values, { setSubmitting, setErrors, isValid }) => {
          api.identities.put({ id: values.id, name: values.name }, function (err) {
            if (err) {
              setErrors({ id: err.message })
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
          isSubmitting
        }) => (
          <form onSubmit={handleSubmit}>
            <div className="colgroup">

              <label htmlFor="id"> Id (string) </label>
              <input
                type="text"
                name="id"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.id}
              />

              <ErrorMessage name="id">{msg => <div className="error">{msg}</div>}</ErrorMessage>
            </div>

            <div className="colgroup">

              <label htmlFor="name"> name (string?) </label>
              <input
                type="text"
                name="name"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.name}
              />

              <ErrorMessage name="name">{msg => <div className="error">{msg}</div>}</ErrorMessage>
            </div>

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
      <h1 >Delete identity </h1>

      <Formik
        initialValues={{ id: modalData.id, name: modalData.name, meta: modalData.meta ? JSON.stringify(modalData.meta) : '' }}
        validate={values => {
          let errors = {};
          if (!values.id) {
            errors.id = 'Required';
          }

          return errors;
        }}
        onSubmit={(values, { setSubmitting, setErrors, isValid }) => {
          api.identities.remove(values.id, function (err) {
            if (err) {
              setErrors({ name: err.message })
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
          isSubmitting
        }) => (
          <form onSubmit={handleSubmit}>
            <div className="colgroup">

              <h2>Are you sure you want to delete the identity?</h2>
              <label htmlFor="id">Id*</label>
              <input
                type="text"
                readOnly
                name="id"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.id}
              />
            </div>
            <div className="colgroup">

              <label htmlFor="name"> Name </label>
              <input
                type="text"
                readOnly
                name="name"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.name}
              />
            </div>
            <ErrorMessage name="id">{msg => <div className="error">{msg}</div>}</ErrorMessage>

            <button type="submit" disabled={isSubmitting}>Delete</button>
          </form>
        )}
      </Formik>
      <button className="close" style={{
        fontSize: "2em",
        padding: 0,
        border: "none",
        display: 'block',
        cursor: "pointer",
        position: "absolute",
        top: "0px",
        right: "5px",
      }} onClick={hideDel}> <FontAwesomeIcon icon={faWindowClose} /></button>
    </ReactModal>
  ), [modalData]);


  const openDelModal = useCallback(data => {
    setModalData(data);
    showDel();
  });

  const [data, setData] = useState([])
  const [groups, setGroups] = useState([])

  useEffect(() => {
    let abortable
    let abortable2

    if (api.identities && api.identities.ls) {
      abortable = Abortable()
      abortable2 = Abortable()

      _(api.groups.ls({ live: true, old: true }), abortable2, _.drain((item) => {
        if (!_.isPlainObject(item)) return
        const index = groups.findIndex((ele) => ele.id === item.id)
        if (index === -1) {
          groups.push(item)
          setGroups([...groups].filter((item) => item.delete !== true))
          return
        }
        if (groups[index].ts < item.ts) {
          groups[index] = item
          setGroups([...groups].filter((item) => item.delete !== true))
        }
      }, () => { abortable2 = null }))

      _(api.identities.ls({ live: true, old: true }), abortable, _.drain((item) => {
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
  return (<div className="identities">
    <h2>Identities</h2>
    <button className="add" onClick={openAddModal}><FontAwesomeIcon icon={faUserPlus} /> Add identity</button>
    {data.map((identity, index) =>
      <Collapsible
        key={`identity_${identity.id}}`} classParentString="identity"
        trigger={trigger(false, identity, index)} triggerWhenOpen={trigger(true, identity, index)}
      >

        <Formik enableReinitialize={true}
          initialValues={{ id: identity.id, name: identity.name, groups: identity.groups || [], meta: identity.meta, ts: identity.ts }}
          validate={values => {
            let errors = {};
            if (!values.id) {
              errors.id = 'Required';
            }

            //  errors.email = 'Invalid email address';

            return errors;
          }}
          onSubmit={(values, { setSubmitting, setErrors, isValid }) => {
            setSubmitting(false);

            api.identities.put({ id: values.id, name: values.name, groups: values.groups, meta: values.meta }, function (err) {
              if (err) {
                setErrors({ meta: err.message })
                setSubmitting(false);
                return false;
              }
              setSubmitting(false);
            });

          }}
        >
          {({
            values,
            isSubmitting,
          }) => (
            <Form>
              <div className="colgroup">

                <label htmlFor="id">Id (string)</label>
                <Field
                  type="text"
                  readOnly
                  name="id"
                  value={values.id}
                />

              </div>
              <ErrorMessage name="id">{msg => <div className="error">{msg}</div>}</ErrorMessage>

              <div className="colgroup">

                <label htmlFor="name">Name (string?)</label>
                <Field
                  type="text"
                  name="name"
                  value={values.name}
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

                <label htmlFor="groups">Groups (array|string?)</label>

                <FieldArray
                  name="groups"
                  render={arrayHelpers => (
                    <div key={"group_allow_" + identity.id}>
                      {values.groups.map((groupID, index) => {
                        const gIndex = groups.findIndex((ele) => ele.id === groupID)
                        let key = groupID;
                        if (gIndex !== -1) {
                          key = groups[gIndex].name + " id:" + groupID
                        }
                        return (
                          <div key={"allow_groups_" + groupID + index}>
                            <div className="addbar"><Field readOnly label="field" onChange={() => { }} value={key} name={`groups[${index}]`} />
                              <button type="button" onClick={() => arrayHelpers.remove(index)}>
                                <FontAwesomeIcon icon={faMinusCircle}></FontAwesomeIcon>
                              </button>

                            </div>

                          </div>
                        )
                      })}
                      <div key={"group_addbar" + index} className="addbar">
                        <label>Group:</label>
                        <FSelect isSearchable={false} className="select-container"
                          classNamePrefix="select" key={"allow_group_value_" + index} name={"allow_group_value_" + index} options={groups.reduce((a, b) => {
                            a.push({ label: b.name || b.id, value: b.id })
                            return a
                          }, [])} />

                        <button
                          type="button"
                          onClick={() => arrayHelpers.push(values["allow_group_value_" + index] || "")}
                        >
                          <FontAwesomeIcon icon={faPlusCircle}></FontAwesomeIcon>
                        </button>
                      </div>
                    </div>
                  )}
                />
              </div>

              <ErrorMessage name="groups">{msg => <div className="error">{msg}</div>}</ErrorMessage>

              <div className="colgroup">

                <label htmlFor="meta"> Meta (object?)</label>


                <Field

                  name="meta"
                >
                  {({ form, field, meta }) => {
                    return (
                      <div key={"meta_content_" + index}>
                        {
                          field.value ? Object.entries(flatten(field.value, { safe: false })).map((fitem, i) => {
                            return (<div key={"addbar_meta_" + i + "_" + index} className="addbar"><label>{"meta." + fitem[0]}</label><input type="text" readOnly={false} onChange={(e) => {
                              let obj = field.value ? flatten(field.value, { safe: false }) : {}
                              obj[fitem[0]] = e.target.value
                              form.setFieldValue(field.name, unflatten(obj, { safe: false }))

                            }} value={fitem[1]} />
                              <button
                                type="button"
                                onClick={() => {
                                  let obj = field.value ? flatten(field.value, { safe: false }) : {}

                                  delete obj[fitem[0]]
                                  form.setFieldValue(field.name, unflatten(obj, { safe: false }))


                                }}
                              >
                                <FontAwesomeIcon icon={faMinusCircle}></FontAwesomeIcon>
                              </button>
                            </div>)

                          }) : ''
                        }
                        {meta.touched && meta.error && (
                          <div className="error">{meta.error}</div>
                        )}
                        {(<div key={"addbar2_meta_" + index} className="addbar">

                          <label>Key:</label><input name={"key_meta_" + index} value={form.values["key_meta_" + index]} readOnly={false} type="text" onChange={
                            (e) => form.setFieldValue("key_meta_" + index, e.target.value)
                          } />
                          <label>Value:</label><input name={"value_meta_" + index} value={form.values["value_meta_" + index]} readOnly={false} type="text" onChange={
                            (e) => form.setFieldValue("value_meta_" + index, e.target.value)
                          } />
                          <button
                            type="button"
                            onClick={() => {
                              let obj = field.value ? flatten(field.value, { safe: false }) : {}

                              obj[form.values["key_meta_" + index]] = form.values["value_meta_" + index]

                              form.setFieldValue("value_meta_" + index, "", false)
                              form.setFieldValue("key_meta_" + index, "", false)
                              form.setFieldValue(field.name, unflatten(obj, { safe: false }))
                            }}
                          >
                            <FontAwesomeIcon icon={faPlusCircle}></FontAwesomeIcon>
                          </button>
                        </div>
                        )}
                      </div>
                    )
                  }}

                </Field>
              </div>

              <ErrorMessage name="meta">{msg => <div className="error">{msg}</div>}</ErrorMessage>
              <button type="submit" disabled={isSubmitting}>Save</button>
            </Form>
          )}
        </Formik>

      </Collapsible>
    )}


  </div>)
}


export default Identitites