import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faMinusCircle } from '@fortawesome/free-solid-svg-icons'
import { Field } from 'formik';
import Switch from "react-switch"
const unflatten = require('flat').unflatten;
const flatten = require('flat').flatten;

function RenderInput({ item, readOnly }) {

  const renderLabel = (item) => item.types.length > 1 ? (<label htmlFor={item.name}>{item.type}{item.required ? "" : "?"}</label>) : ''
  const getName = (field, index) => {

    let split = field.name.split("_");
    split = split.slice(0, split.length - 1)
    split.push(index)
    return split.join("_")

  }
  const createField = (item) => {
    if (item.type === "string" || item.type === "number") {
      return (<Field name={item.name} type="text" readOnly={readOnly} validate={readOnly ? null : item.validate}>
        {({
          field,
          form: { touched, errors, setFieldValue, values },
          meta,
        }) => (
          <div key={"string_" + item.name}>
            <input key={"input" + item.name} readOnly={readOnly} {...field} onChange={(e) => {
              field.onChange(e)

              item.types.forEach((element, index) => {
                if (element === item.type) return
                let fieldName = getName(field, index);
                let f = e.target.value
                if (element === "boolean") {
                  if (f === "true" || f === 1 || f === "1") return setFieldValue(fieldName, true, true)
                  return setFieldValue(fieldName, false, true)
                }

                if (element === "number") {
                  if (!isNaN(e.target.value)) setFieldValue(fieldName, e.target.value, true)
                }

                if (element === "string") {
                  setFieldValue(fieldName, e.target.value, false)
                }

                if (element === "array") {
                  setFieldValue(fieldName, undefined)
                }
                if (element === "object") {
                  setFieldValue(fieldName, undefined)
                }
              })

            }} />
            {meta.touched && meta.error && (
              <div className="error">{meta.error}</div>
            )}
          </div>
        )}

      </Field>)
    }

    if (item.type === "boolean") {
      return (<Field name={item.name} validate={readOnly ? null : item.validate} type="switch" >
        {({
          field,
          form: { touched, errors, values, setFieldValue },
          meta,

        }) => (
          <div key={"boolean_container_" + item.name}>
            <Switch name={field.name} disabled={readOnly} onChange={(e) => {
              if (e === "true" || e === true || e === 1) e = true
              else e = false

              item.types.forEach((element, index) => {
                let split = field.name.split("_");
                split = split.slice(0, split.length - 1)
                split.push(index)
                split = split.join("_")
                setFieldValue(split, e)

              })

            }} onBlur={field.onBlur} value={field.value || false} checked={field.value || false} />
            {meta.touched && meta.error && (
              <div className="error">{meta.error}</div>
            )}
          </div>
        )}
      </Field>
      )
    }

    if (item.type === "object") {
      return (<Field

        name={item.name}
        validate={readOnly ? null : item.validate}
      >
        {({ form, field, meta }) => {
          return (
            <div key={"object_content_" + item.name}>
              {
                field.value ? Object.entries(flatten(field.value, { safe: false })).map((fitem, i) => {
                  return (<div key={"addbar_" + i + "_" + item.name} className="addbar"><label>{item.key + "." + fitem[0]}</label><input type="text" readOnly={readOnly} onChange={(e) => {
                    if (readOnly === true) return
                    let obj = field.value ? flatten(field.value, { safe: false }) : {}
                    obj[fitem[0]] = e.target.value
                    form.setFieldValue(field.name, unflatten(obj, { safe: false }))

                  }} value={fitem[1]} />
                    {readOnly ? "" : (<button
                      type="button"
                      onClick={() => {
                        let obj = field.value ? flatten(field.value, { safe: false }) : {}

                        delete obj[fitem[0]]
                        form.setFieldValue(field.name, unflatten(obj, { safe: false }))


                      }}
                    >
                      <FontAwesomeIcon icon={faMinusCircle}></FontAwesomeIcon>
                    </button>)}
                  </div>)

                }) : ''
              }
              {meta.touched && meta.error && (
                <div className="error">{meta.error}</div>
              )}
              {readOnly ? "" : (<div key={"addbar2_" + item.name} className="addbar">

                <label>Key:</label>
                <input name={"key_" + item.name} value={form.values["key_" + item.name]} readOnly={readOnly} type="text" onChange={
                  (e) => form.setFieldValue("key_" + item.name, e.target.value)
                } />
                <label>Value:</label>
                <input name={"value_" + item.name} value={form.values["value_" + item.name]} readOnly={readOnly} type="text" onChange={
                  (e) => form.setFieldValue("value_" + item.name, e.target.value)
                } />
                <button
                  type="button"
                  onClick={() => {
                    let obj = field.value ? flatten(field.value, { safe: false }) : {}

                    obj[form.values["key_" + item.name]] = form.values["value_" + item.name]

                    form.setFieldValue("value_" + item.name, "", false)
                    form.setFieldValue("key_" + item.name, "", false)
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

      </Field>)
    }

    if (item.type === "array") {
      return (<Field
        key={item.name}
        name={item.name}
        validate={readOnly ? null : item.validate}>
        {({ form, field, meta }) => {
          return (
            <div key={"array_content_" + item.name}>

              {
                field.value ? Object.entries(flatten(field.value, { safe: true })).map((fitem, index) => {
                  return (<div key={"array_addbar_" + item.name + "_" + index} className="addbar">
                    <label>{(isNaN(item.key) ? item.key : parseInt(item.key) + 1) + "." + fitem[0]}</label>
                    <input readOnly={readOnly} type="text" onChange={(e) => {
                    let obj = { groups: field.value ? flatten(field.value, { safe: true }) : [] }
                    if (readOnly) return;
                    obj.groups[fitem[0]] = e.target.value
                    form.setFieldValue(field.name, unflatten(obj, { safe: true }).groups)

                  }} value={fitem[1]} />
                    {readOnly ? "" : (<button
                      type="button"
                      onClick={() => {

                        let obj = { groups: field.value ? flatten(field.value, { safe: true }) : {} }

                        delete obj.groups[fitem[0]]
                        form.setFieldValue(field.name, unflatten(obj, { safe: true }).groups)


                      }}
                    >
                      <FontAwesomeIcon icon={faMinusCircle}></FontAwesomeIcon>
                    </button>)}
                  </div>)

                }) : ''
              }
              {meta.touched && meta.error && (
                <div className="error">{meta.error}</div>
              )}
              {readOnly ? "" : (<div className="addbar">

                <label>Key:</label>
                <input name={"key_" + item.name} value={form.values["key_" + item.name]} type="text" readOnly={readOnly} onChange={
                  (e) => form.setFieldValue("key_" + item.name, e.target.value)
                } />
                <label>Value:</label>
                <input name={"value_" + item.name} value={form.values["value_" + item.name]} type="text" readOnly={readOnly} onChange={
                  (e) => form.setFieldValue("value_" + item.name, e.target.value)
                } />
                <button
                  type="button"
                  onClick={() => {
                    let obj = { groups: field.value ? flatten(field.value, { safe: true }) : [] }
                    obj.groups[form.values["key_" + item.name]] = form.values["value_" + item.name]
                    form.setFieldValue(field.name, unflatten(obj, { safe: true }).groups)
                    form.setFieldValue("value_" + item.name, "", false)
                    form.setFieldValue("key_" + item.name, "", false)
                  }}
                >
                  <FontAwesomeIcon icon={faPlusCircle}></FontAwesomeIcon>
                </button>
              </div>)}

            </div>
          )
        }}
      </Field>)
    }
    return (<div></div>)
  }


  return (<div>{renderLabel(item)} { createField(item)} </div>)

}

export default RenderInput
