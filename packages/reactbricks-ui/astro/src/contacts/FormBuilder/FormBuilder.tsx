// import { useSubmit } from '@formspree/react'
import classNames from 'classnames'
import {
  fetchForms,
  reactBricksAstroStore,
  Repeater,
  sendFormSubmission,
  types,
  useReactBricksContext,
} from 'react-bricks/astro'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useForm } from 'react-hook-form'
import blockNames from '../../blockNames'
import { buttonColors } from '../../colors'
import type { LayoutProps } from '../../LayoutSideProps'
import {
  createSubmissionError,
  type FormSubmissionError,
} from '../../shared/FormNewsletter/NewsletterUtils'

export interface FormBuilderProps extends LayoutProps {
  successMessage: string
  formId: string
  buttonPosition: string
  formElements: types.RepeaterItems
  formButtons: types.RepeaterItems
}

const FormBuilder: types.Brick<FormBuilderProps> = ({
  successMessage,
  formId,
  buttonPosition,
  formElements,
  formButtons,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful, isSubmitting },
    setError,
  } = useForm()

  const { executeRecaptcha } = useGoogleReCaptcha()
  const rbContext = useReactBricksContext()

  const onSubmit = async ({ email, ...data }: any) => {
    try {
      if (!executeRecaptcha) {
        throw createSubmissionError(
          'recaptchaUnavailable',
          'reCAPTCHA is not available. Please reload the page and try again.'
        )
      }

      let token: string | undefined
      try {
        token = await executeRecaptcha('form_submit')
      } catch (err) {
        console.log(err)
        throw createSubmissionError(
          'recaptchaExecution',
          'Failed to execute reCAPTCHA. Please try again.',
          err
        )
      }

      if (!token) {
        throw createSubmissionError(
          'recaptchaToken',
          'Failed to verify reCAPTCHA token. Please try again.'
        )
      }

      let result: Awaited<ReturnType<typeof sendFormSubmission>>
      try {
        result = await sendFormSubmission({
          appId: rbContext.appId,
          appEnv: rbContext.environment,
          token,
          formId,
          emailAddress: email,
          data,
          fetchOptions: { apiPrefix: rbContext.apiPrefix },
        })
      } catch (err) {
        throw createSubmissionError(
          'submissionNetwork',
          'We were unable to submit your form. Please check your connection and try again.',
          err
        )
      }

      if (!result.success) {
        const message =
          'There was a problem sending your request. Please try again.'

        throw createSubmissionError('submissionFailed', message)
      }
    } catch (err) {
      const fallbackMessage =
        'There was a problem sending your request. Please try again.'
      const submissionError =
        err instanceof Error
          ? (err as FormSubmissionError)
          : createSubmissionError('submission', fallbackMessage, err)
      if (
        !(err instanceof Error) &&
        submissionError.originalError === undefined
      ) {
        submissionError.originalError = err
      }
      const message = submissionError.message || fallbackMessage
      const type = submissionError.submissionType || 'submission'
      if (setError) {
        setError(`root.${type}` as any, {
          type,
          message,
        })
      }
      throw submissionError
    }
  }
  // const onSubmit = useSubmit(formspreeFormId, {
  //   onError(errs) {
  //     const formErrs = errs.getFormErrors()
  //     for (const { code, message } of formErrs) {
  //       setError(`root.${code}`, {
  //         type: code,
  //         message,
  //       })
  //     }

  //     const fieldErrs = errs.getAllFieldErrors()
  //     for (const [field, errs] of fieldErrs) {
  //       setError(field, {
  //         message: errs.map((e) => e.message).join(', '),
  //       })
  //     }
  //   },
  // })

  return isSubmitSuccessful ? (
    <h2 className="mt-6 text-xl leading-7 font-bold text-lime-600">
      {successMessage}
    </h2>
  ) : (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-2 gap-4 p-6"
    >
      <Repeater
        propName="formElements"
        items={formElements}
        itemProps={{ register, errors }}
      />

      {errors.root && (
        <div className="block">
          <ul className="error">
            {Object.values(errors.root).map((err) => {
              if (typeof err !== 'object') {
                return (
                  <li
                    key={err}
                    className="block mt-1 text-sm text-red-500 font-bold"
                  >
                    {err}
                  </li>
                )
              }
              const { type, message } = err
              return (
                <li
                  key={type}
                  className="block mt-1 text-sm text-red-500 font-bold"
                >
                  {message}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <Repeater
        propName="formButtons"
        items={formButtons}
        itemProps={{ disabled: isSubmitting }}
        renderWrapper={(items) => (
          <div
            className={classNames(
              'w-full flex space-x-6 col-span-2',
              buttonPosition
            )}
          >
            {items}
          </div>
        )}
      />
    </form>
  )
}

FormBuilder.schema = {
  name: blockNames.FormBuilder,
  label: 'Form',
  category: 'contact',
  hideFromAddMenu: true,
  previewImageUrl: `/bricks-preview-images/${blockNames.FormBuilder}.png`,
  playgroundLinkLabel: 'View source code on Github',
  playgroundLinkUrl:
    'https://github.com/ReactBricks/reactbricks-starters/blob/main/packages/reactbricks-ui/astro/src/contacts/FormBuilder/FormBuilder.tsx',
  repeaterItems: [
    {
      name: 'formElements',
      label: 'Form elements',
      items: [
        { type: blockNames.FormInput },
        { type: blockNames.FormTextArea },
        { type: blockNames.FormCheckbox },
        { type: blockNames.FormSelect },
        { type: blockNames.FormRadiobuttons },
      ],
    },
    {
      name: 'formButtons',
      itemLabel: 'Button',
      itemType: blockNames.Button,
      min: 1,
      max: 2,
    },
  ],

  sideEditProps: [
    {
      groupName: 'Form data',
      defaultOpen: true,
      props: [
        {
          name: 'formId',
          label: 'Form',
          type: types.SideEditPropType.Select,
          selectOptions: {
            display: types.OptionsDisplay.Select,
            getOptions: async () => {
              const apiPrefix = reactBricksAstroStore.getConfig().apiPrefix
              const items = await fetchForms({ apiPrefix })

              return [
                { value: '', label: '--Select Form--' },
                ...items.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]
            },
          },
        },
        {
          name: 'successMessage',
          label: 'Success Message',
          type: types.SideEditPropType.Textarea,
        },
      ],
    },
    {
      groupName: 'Buttons',
      defaultOpen: true,
      props: [
        {
          name: 'buttonPosition',
          label: 'Buttons position',
          type: types.SideEditPropType.Select,
          selectOptions: {
            display: types.OptionsDisplay.Select,
            options: [
              { value: 'justify-start', label: 'Left' },
              { value: 'justify-center', label: 'Center' },
              { value: 'justify-end', label: 'Right' },
            ],
          },
        },
      ],
    },
  ],

  getDefaultProps: () => ({
    buttonPosition: 'justify-center',
    formElements: [
      {
        type: blockNames.FormInput,
        props: {
          fieldName: 'firstname',
          isRequired: false,
          inputType: 'text',
          columns: '1',
          label: 'First Name',
          requiredError: '',
          pattern: '',
          patternError: '',
        },
      },
      {
        type: blockNames.FormInput,
        props: {
          fieldName: 'lastname',
          isRequired: false,
          inputType: 'text',
          columns: '1',
          label: 'Last Name',
          requiredError: '',
          pattern: '',
          patternError: '',
        },
      },
      {
        type: blockNames.FormInput,
        props: {
          fieldName: 'email',
          isRequired: true,
          inputType: 'email',
          columns: '2',
          label: 'Email',
          requiredError: 'Email is required',
          pattern: '',
          patternError: '',
        },
      },
      {
        type: blockNames.FormTextArea,
        props: {
          fieldName: 'message',
          isRequired: false,
          columns: '2',
          label: 'Message',
          requiredError: '',
          pattern: '',
          patternError: '',
        },
      },
      {
        type: blockNames.FormCheckbox,
        props: {
          fieldName: 'privacy',
          isRequired: true,
          columns: '2',
          label: 'I accept the processing of my data',
          requiredError: 'Please, accept our privacy terms',
          pattern: '',
          patternError: '',
        },
      },
    ],
    formButtons: [
      {
        type: 'button',
        buttonType: 'submit',
        buttonColor: buttonColors.SKY.value,
        text: 'Send',
        variant: 'solid',
      },
    ],
  }),
  astroInteractivity: 'idle',
}

export default FormBuilder
