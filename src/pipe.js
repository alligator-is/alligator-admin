import { _ } from "alligator-client"
import Abortable from 'pull-abortable'
import promiseToSource from 'pull-from-promise'
import asyncToSource from "pull-async"

import { flatten } from 'flat'

export default function Pipe(commands, connection, drain, _done) {
  let done = (...args) => {
    if (_done) {

      _done(...args)
      return;
    }
  }
  let lb = flatten(connection.lb, { safe: false })

  let actions = []
  let abortable = Abortable()

  const abort = (err) => {
    if (abortable) {
      abortable.abort(err || true)
      abortable = null
    }
  }


  for (let command of commands) {
    let func = lb[command.action]
    let args = command.defaults || []

    if (command.kind === "scalar") if (command.defaults) args = command.defaults
    if (command.kind === "object") if (command.defaults) args = [command.defaults]
    if (command.kind === "tulpe") if (command.defaults) args = command.defaults

    if (!func) return done(command.action + " not found on lb")
    if (func.type === "async" || func.type === "sync")
      actions.push(asyncToSource((cb) => {
        func(...args, cb)
      }))

    else if (command.type === "promise")
      actions.push(promiseToSource(func(args)))

    else if (command.type === "sink") {
      actions.push(func(...args, done))

    }
    else {
      actions.push(func(...args))
    }

  }

  if (commands.length > 0) {

    actions.push(abortable)
    const last = commands[commands.length - 1];
    if (last && last.type !== "sink") actions.push(_.drain(drain, done))
  }

  _(...actions)

  return abort
}