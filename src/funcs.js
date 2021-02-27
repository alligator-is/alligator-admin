import { _ } from "alligator-client"
import React, { useEffect, useState, useRef } from 'react';
import Abortable from 'pull-abortable'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronUp, faStop, faChevronDown, faPlusSquare, faPlay, faMinusSquare } from '@fortawesome/free-solid-svg-icons'
import Collapsible from 'react-collapsible';
import RenderInput from './renderInput'
import { Formik, Form, useFormikContext } from 'formik';
import cuid from 'cuid';
import Pipe from "./pipe";

const superstruct = require("superstruct").superstruct
const unflatten = require('flat').unflatten;

function toInputFormat(items) {
  const newItems = []

  items.forEach((item) => {
    const input = superstruct()(item.input || {}, item.defaults || "")
    let schema = {}
    let defaults = {}
    let usage = {};

    item.kind = input.kind
    if (input.kind === "object") {
      schema = input.schema

      if (item.defaults && _.isPlainObject(item.defaults))
        defaults = item.defaults


      if (item.usage && _.isPlainObject(item.usage)) {
        usage = item.usage
      }
    }

    if (input.kind === "scalar") {
      schema = { 0: input.schema }

      if (item.defaults && _.isString(item.defaults)) defaults = { 0: item.defaults }
      if (item.usage && _.isString(item.usage)) usage = { 0: item.usage }

    }

    if (input.kind === "tuple") {
      schema = input.schema.reduce((a, value, index) => {
        a[(index)] = value

        return a
      }, {})

      if (item.usage && Array.isArray(item.usage)) {
        usage = item.defaults.reduce((a, value, index) => {
          a[(index)] = value

          return a
        }, {})
      }
      if (item.defaults && Array.isArray(item.defaults)) {
        defaults = item.defaults.reduce((a, value, index) => {
          a[(index)] = value

          return a
        }, {})
      }

    }



    if (schema)
      for (let i of Object.keys(schema))
        if (defaults[i] === undefined) defaults[i] = undefined


    const parseTypes = (types) => {
      types = types.split("|")
      const nTypes = []
      for (let i in types) {
        nTypes.push(types[i])

      }

      return nTypes
    }

    const mapTypes = (types, key) => {
      types = parseTypes(types)
      const newTypes = []

      types.forEach((type, index) => {
        let required = type.indexOf("?") === -1
        type = type.replace("?", "")
        const name = item.index + "_" + key + (types.length > 1 ? ("_" + index) : "");

        let item2 = { key, type, name, types, id: item.index, required: required }
        const s = superstruct()(types.join("|"), item2.value)

        item2.validate = (data) => {
          try {
            if (_.isString(data) && data.trim().length === 0) data = null
            if (_.isPlainObject(data) && Object.keys(data).length === 0) data = null;
            if (Array.isArray(data) && data.length === 0) data = null;
            if (!data)
              for (let d of newTypes) {
                if (d.value !== undefined || d.value !== null) {
                  data = d.value
                  break;
                }
              }
            s(data)
          }
          catch (err) {
            return err.message
          }
          return null
        }

        if (type === "string") {

          item2.usage = _.isString(usage[key]) ? usage[key] : undefined
          item2.value = _.isString(defaults[key]) ? defaults[key] : undefined

          newTypes.push(item2)
          return
        }

        if (type === "number") {

          item2.usage = usage[key]
          item2.value = !isNaN(defaults[key]) ? defaults[key] : undefined

          newTypes.push(item2)
          return

        }

        if (type === "object") {

          item2.usage = usage[key]
          item2.value = _.isPlainObject(defaults[key]) ? defaults[key] : undefined

          newTypes.push(item2)
          return

        }

        if (type === "array") {
          item2.usage = usage[key]
          item2.value = Array.isArray(defaults[key]) ? defaults[key] : undefined
          newTypes.push(item2)
          return
        }

        if (type === "boolean") {
          item2.usage = usage[key]

          item2.value = defaults[key] !== null ? defaults[key] : false
          newTypes.push(item2)
          return
        }

      })

      return newTypes
    }
    Object.keys(schema).reduce((a, key) => {
      a.push({ id: item.index, action: item.action, types: mapTypes(schema[key], key), type: schema[key] })

      return a
    }, []).forEach((item) => newItems.push(item))


  })
  return newItems
}

const UpdateCommands = ({ commands, setCommands, defaultValues }) => {
  const { values } = useFormikContext();
  useEffect(() => {
    const ncommands = commands.reduce((a, b) => {
      a[b.index] = b
      return a;
    }, {})
    if (values) {
      const fValues = unflatten(values, { safe: false, delimiter: "_" })

      for (var key of Object.keys(fValues)) {
        const command = ncommands[key]
        if (command) {
          const value = fValues[key]
          if (command.kind === "object") {
            const d = Object.keys(value)

            for (const k2 of d) {
              if (value[k2]) {
                const isOr = command.input[k2] && command.input[k2].indexOf("|") !== -1
                if (isOr) {
                  if (!command.defaults) command.defaults = {}
                  const arr = value[k2]
                  if (Array.isArray(arr)) {

                    for (var v of arr) {
                      if (v !== null) {
                        command.defaults[k2] = v;
                        break;
                      }
                    }
                  }

                }
                else {

                  if (!command.defaults) command.defaults = {}
                  command.defaults[k2] = value[k2]
                }

              }
            }
          }
          if (command.kind === "scalar") {
            command.defaults = value
          }
          if (command.kind === "tuple") {
            if (Array.isArray(value)) command.defaults = value
          }
        }


      }

      setCommands(commands)

    }
  }, [values])


  return null;
}

const ScrollToBottom = ({ result }) => {
  const elementRef = useRef();
  useEffect(() => {
    elementRef.current.scrollIntoView({ block: "end" })
  }, [result]);
  return <div ref={elementRef} />;
};

function Functions({ connection, expanded }) {

  const [data, setData] = useState([])
  const [commands, setCommands] = useState([])
  const [currentPipe, setPipe] = useState(null)
  const [pipeError, setPipeError] = useState(null)


  const [result, setResult] = useState([])

  let inputFormat = toInputFormat(data)

  const defaultValues = inputFormat.reduce((a, b) => {
    b.types.forEach(function (item) {
      a.push(item)
    })
    return a;
  }, []).reduce((a, b) => {
    a[b.name] = b.value
    return a
  }, {})

  const commandsFormat = toInputFormat(commands)
  const defaultValuesForCommands = commandsFormat.reduce((a, b) => {
    b.types.forEach(function (item) {
      a.push(item)
    })
    return a;
  }, []).reduce((a, b) => {
    a[b.name] = b.value
    return a
  }, {})

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
        const index = data.findIndex((ele) => ele.action === item.action)
        if (index === -1) {
          data.push({ index: cuid(), ...item })
          setData([...data])
          return
        }

        if (data[index].ts < item.ts) {

          item.index = data[index].index
          data[index] = item
          setData([...data])
        }

      }, abort))

      return abort
    }
  }, [connection])


  let triggerPipe = (open, item, index) => {

    return (<div key={"command_collapse_trigger_" + index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>{item.action} <div>
      <button onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setCommands(commands.filter((i) => i.index !== item.index))
      }}><FontAwesomeIcon icon={faMinusSquare} /></button>

      <button><FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} /></button></div>
    </div>)
  }

  let triggerFunc = (open, item, index) =>
  (<div key={"func_collapse_trigger_" + index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>{item.action} <div>
    <button onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setCommands([...commands, { ...item, index: cuid() }])
    }}><FontAwesomeIcon icon={faPlusSquare} /></button>

    <button><FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} /></button></div>
  </div>)


  const onSubmit = (value, { setSubmitting, isSubmitting }) => {
    setPipeError(null)

    result.splice(0)
    let res = []
    let p = Pipe(commands, connection, (data) => {
      result.slice(0).forEach((i) => res.push(i))
      if (data !== undefined) {
        try {
          res.push(JSON.stringify(data, 2));
        }
        catch (err) {
          res.push(data);
        }
      }

      setResult(res)



    }, (err) => {

      setPipe(null)
      setSubmitting(false)
      if (err) setPipeError(err && err.message ? err.message : err)
    })

    setPipe({ abort: p })

  }

  return (<div key={"functions_container"}>
    <div key={"pipeline"} className="pipeline">
      <h2>Pipeline</h2>

      <Formik enableReinitialize={true} onSubmit={onSubmit} initialValues={defaultValuesForCommands}  >
        {({ isSubmitting }) => {

          return (<Form>
            <UpdateCommands setCommands={setCommands} commands={commands} defaultValues={defaultValues} />


            {commands.map((item, index) => (
              <Collapsible
                key={`command_${index}_${item.index}_${item.action}`} classParentString="func"
                trigger={triggerPipe(false, item, index)} triggerWhenOpen={triggerPipe(true, item, index)}>
                {item.desc}
                <h3 style={{ margin: ".8em 0", display: "block" }}>Options:</h3>
                {
                  commandsFormat.map((item2) => {
                    if (item2.id === item.index)
                      return item2["types"].map((field, index) => {
                        return (<div key={"functions_types_" + index + "_" + item.index}>{index === 0 ? (<label key={"functions_label_" + index + "_" + item.index}>{field.key && !isNaN(field.key) ? parseInt(field.key) + 1 : field.key} ({item2.type}) {field.usage !== undefined ? field.usage : ''}</label>) : ''}


                          <RenderInput key={"commands_render_" + index + "_" + item.index} readOnly={false} item={field}></RenderInput>
                          {index !== item2.types.length - 1 ? (<label key={"functions_label3_" + index + "_" + item.index}>or</label>) : ''}
                        </div>)

                      }
                      )
                    return ''
                  })
                }

              </Collapsible>

            ))}
            <div className="formbuttons">

              <button disabled={isSubmitting || commands.length === 0} type="submit">RUN <FontAwesomeIcon icon={faPlay} /></button>
              <button onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (currentPipe) currentPipe.abort()
              }} style={{ display: currentPipe !== null ? "block" : "none" }} >Abort <FontAwesomeIcon icon={faStop} /></button>
            </div>

          </Form>)
        }}
      </Formik>

      <h3>Result:</h3>
      <code className="result">
        {result.join("\n\n")}
        <br />
        <br />

        {pipeError ? (<span style={{ color: "red" }}>{pipeError}</span>) : ''}
        <ScrollToBottom result={result}></ScrollToBottom>
      </code>
    </div>
    <div key={"functions"} className="functions">

      <h2>Functions</h2>
      <Formik enableReinitialize={true} initialValues={defaultValues} validateOnChange={false} validateOnBlur={false} >
        <Form>
          {data.map((item, index) => (<Collapsible
            key={`func_collapse_${index}_${item.action}`} classParentString="func"
            trigger={triggerFunc(false, item, index)} triggerWhenOpen={triggerFunc(true, item, index)}>
            {item.desc}

            <h3 style={{ margin: ".8em 0", display: "block" }}>Options:</h3>
            {
              inputFormat.map((item2) => {
                if (item2.id === item.index)
                  return item2["types"].map((field, index) => {
                    return (<div key={"functions_container_div_" + index + "_" + item.index}>{index === 0 ? (<label key={"functions_label2_" + index + "_" + item.index}>{field.key} ({item2.type}) {field.usage !== undefined ? field.usage : ''}</label>) : ''}
                      <RenderInput key={"functions_render_" + index + "_" + item.index} readOnly={true} item={field}></RenderInput>
                      {index !== item2.types.length - 1 ? (<label key={"functions_label4_" + index + "_" + item.index}>or</label>) : ''}
                    </div>)

                  }
                  )
                return ''
              })
            }

          </Collapsible>

          ))}
        </Form>
      </Formik>
    </div>
  </div>)
}
export default Functions