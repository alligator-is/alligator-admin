import Select from 'react-select'
import { Field } from 'formik'

function FSelect({ name, ...args }) {
  return (<Field
    name={name}
  >
    {({ form, field, meta }) => {
      return (<Select {...args} onChange={(e) => {
        form.setFieldValue(name, e.value)
      }} ></Select>)
    }}
  </Field>)
}


export default FSelect