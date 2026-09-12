import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type {
  ChangeEvent,
  FocusEvent,
  FormEvent,
  FormHTMLAttributes,
  ReactElement,
  ReactNode,
} from 'react'
import { cn } from '#/lib/cn'

export type FormValues = Record<string, FormDataEntryValue | undefined>

export type FormRule = {
  required?: boolean
  message?: string
  type?: 'email'
  pattern?: RegExp
  validator?: (value: FormDataEntryValue | undefined, values: FormValues) => void | string | Promise<void | string>
}

type FieldError = { name: string; errors: string[] }
type ValidateTrigger = 'submit' | 'blur' | 'change'
type FormContextValue = {
  values: FormValues
  errors: Record<string, string>
  register: (name: string, rules: FormRule[]) => void
  setValue: (name: string, value: FormDataEntryValue | undefined) => void
  validateField: (name: string, value?: FormDataEntryValue, sourceValues?: FormValues) => Promise<string | undefined>
  validateTrigger: ValidateTrigger[]
}

const FormContext = createContext<FormContextValue | null>(null)

export type FormProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  children?: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  initialValues?: Record<string, unknown>
  onFinish?: (values: FormValues) => void | Promise<void>
  onFinishFailed?: (info: { errorFields: FieldError[]; values: FormValues }) => void
  validateTrigger?: ValidateTrigger | ValidateTrigger[]
}

export type FormItemProps = {
  name: string
  label?: ReactNode
  required?: boolean
  rules?: FormRule[]
  children: ReactElement
}

function hasValue(value: FormDataEntryValue | undefined) {
  return value !== undefined && value.toString().trim() !== ''
}

async function getRuleError(rule: FormRule, value: FormDataEntryValue | undefined, values: FormValues) {
  if (rule.required && !hasValue(value)) return rule.message ?? 'This field is required.'
  if (!hasValue(value)) return undefined
  if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value!.toString())) {
    return rule.message ?? 'Please enter a valid email.'
  }
  if (rule.pattern && !rule.pattern.test(value!.toString())) return rule.message ?? 'Invalid value.'
  if (rule.validator) {
    const result = await rule.validator(value, values)
    return typeof result === 'string' ? result : undefined
  }
  return undefined
}

function FormRoot({
  children,
  className,
  initialValues = {},
  onFinish,
  onFinishFailed,
  onSubmit,
  validateTrigger = 'submit',
  ...props
}: FormProps) {
  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(Object.entries(initialValues).map(([name, value]) => [name, value?.toString()])),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const rules = useRef(new Map<string, FormRule[]>())
  const triggers = Array.isArray(validateTrigger) ? validateTrigger : [validateTrigger]

  const register = (name: string, fieldRules: FormRule[]) => {
    rules.current.set(name, fieldRules)
  }

  const setValue = (name: string, value: FormDataEntryValue | undefined) => {
    setValues((current) => ({ ...current, [name]: value }))
  }

  const validateField = async (name: string, value = values[name], sourceValues = values) => {
    const fieldRules = rules.current.get(name) ?? []
    for (const rule of fieldRules) {
      const message = await getRuleError(rule, value, { ...sourceValues, [name]: value })
      if (message) {
        setErrors((current) => ({ ...current, [name]: message }))
        return message
      }
    }
    setErrors((current) => {
      const next = { ...current }
      delete next[name]
      return next
    })
    return undefined
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit?.(event)
    const nextValues = Object.fromEntries(new FormData(event.currentTarget).entries())
    setValues(nextValues)
    const errorFields: FieldError[] = []
    for (const name of rules.current.keys()) {
      const message = await validateField(name, nextValues[name], nextValues)
      if (message) errorFields.push({ name, errors: [message] })
    }
    if (errorFields.length) {
      onFinishFailed?.({ errorFields, values: nextValues })
      return
    }
    await onFinish?.(nextValues)
  }

  const context: FormContextValue = { values, errors, register, setValue, validateField, validateTrigger: triggers }

  return (
    <FormContext.Provider value={context}>
      <form
        className={cn('space-y-3', className)}
        {...props}
        onSubmitCapture={(event) => event.preventDefault()}
        onSubmit={handleSubmit}
      >
        {children}
      </form>
    </FormContext.Provider>
  )
}

function FormItem({ name, label, required, rules = [], children }: FormItemProps) {
  const context = useContext(FormContext)
  if (!context) throw new Error('Form.Item must be used inside Form.')
  const form = context

  useEffect(() => {
    context.register(name, rules)
  }, [context, name, rules])

  const child = Children.only(children)
  const childProps = child.props as { id?: string; name?: string; label?: ReactNode; defaultValue?: unknown; onChange?: (event: ChangeEvent<HTMLInputElement>) => void; onBlur?: (event: FocusEvent<HTMLInputElement>) => void }
  const error = form.errors[name]
  const isRequired = required ?? rules.some((rule) => rule.required)

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    childProps.onChange?.(event)
    form.setValue(name, event.target.value)
    // ponytail: validation is opt-in per Form's validateTrigger, like Ant Design.
    if (form.validateTrigger.includes('change')) void form.validateField(name, event.target.value)
  }

  function onBlur(event: FocusEvent<HTMLInputElement>) {
    childProps.onBlur?.(event)
    if (form.validateTrigger.includes('blur')) void form.validateField(name, event.target.value)
  }

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label htmlFor={childProps.id ?? name} className="text-label-md text-on-surface">
          {label}
          {isRequired ? <span className="ml-1 text-error">*</span> : null}
        </label>
      ) : null}
      {cloneElement(child as ReactElement<Record<string, unknown>>, {
        id: childProps.id ?? name,
        name,
        label: childProps.label ?? undefined,
        error,
        defaultValue: childProps.defaultValue ?? form.values[name]?.toString(),
        onChange,
        onBlur,
      })}
    </div>
  )
}

export const Form = Object.assign(FormRoot, { Item: FormItem })
