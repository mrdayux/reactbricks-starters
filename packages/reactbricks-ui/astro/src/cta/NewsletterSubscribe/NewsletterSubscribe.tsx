import classNames from 'classnames'
import React from 'react'
import {
  fetchForms,
  reactBricksAstroStore,
  RichText,
  sendFormSubmission,
  Text,
  types,
  useAdminContext,
  useReactBricksContext,
} from 'react-bricks/astro'
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from 'react-google-recaptcha-v3'
import { useForm } from 'react-hook-form'
import blockNames from '../../blockNames'
import { textColors } from '../../colors'
import type { LayoutProps } from '../../LayoutSideProps'
import {
  containerSizeEditProps,
  neutralBackgroundColorsEditProps,
  sectionDefaults,
} from '../../LayoutSideProps'
import Container from '../../shared/components/Container'
import Section from '../../shared/components/Section'
import {
  createSubmissionError,
  type FormSubmissionError,
} from '../../shared/FormNewsletter/NewsletterUtils'

const NewsletterSubscribeForm: React.FC<{
  buttonText: types.TextValue
  formId: string
  resultOkText: string
}> = ({ buttonText, formId, resultOkText }) => {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const rbContext = useReactBricksContext()

  const { isAdmin } = useAdminContext()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setError,
  } = useForm()

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

  return isSubmitSuccessful ? (
    <div className="p-2.5 mr-5 text-sm text-center font-bold bg-green-200 rounded-[5px] min-w-[270px]">
      {resultOkText}
    </div>
  ) : (
    <form className="mr-5 sm:mb-0 mb-3 flex" onSubmit={handleSubmit(onSubmit)}>
      <div className="relative sm:w-full w-[200px]">
        <svg
          viewBox="0 0 14 14"
          width="14px"
          height="14px"
          className="absolute left-4 top-1/2 -mt-[7px] z-10"
        >
          <path
            fill="#9ca3af"
            d="M0 2.5c0-.27.22-.5.5-.5h13c.28 0 .5.23.5.5v9a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1-.5-.5v-9Zm1 1.02V11h12V3.52L7.31 7.89a.5.5 0 0 1-.52.07.5.5 0 0 1-.1-.07L1 3.52ZM12.03 3H1.97L7 6.87 12.03 3Z"
          ></path>
        </svg>
        <div>
          <input
            type="email"
            {...register('email', {
              required: 'Email is required',
            })}
            id="emailAddress"
            placeholder="Your email"
            className="focus:outline-hidden dark:bg-black rounded-l-[5px] py-2.5 px-[15px] pl-10 text-sm dark:text-white border border-r-0 dark:border-white/50 focus:border-sky-500 dark:focus:border-sky-700"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isAdmin || isSubmitting}
        className="rounded-r-[5px] z-11 relative text-white text-center bg-sky-500 py-[9px] px-[20px] transition-all ease-out hover:-translate-y-[2px] hover:shadow-lg duration-150"
      >
        <Text
          propName="buttonText"
          placeholder="Action"
          renderBlock={(props) => (
            <span className="text-center dark:text-white" {...props.attributes}>
              {props.children}
            </span>
          )}
          value={buttonText}
        />
      </button>
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
    </form>
  )
}

export interface NewsletterProps extends LayoutProps {
  resultOkText: string
  title: types.TextValue
  text: types.TextValue
  buttonText: types.TextValue
  text2: types.TextValue
  formId: string
}

interface IStatus {
  status: string
  message: string
}

const Newsletter: types.Brick<NewsletterProps> = ({
  title,
  text,
  buttonText,
  text2,
  backgroundColor,
  width = 'small',
  formId,
  resultOkText = `Thanks,you're all signed up!`,
}) => {
  const reCaptchaKey = import.meta.env.PUBLIC_RECAPTCHA_KEY || ''

  return (
    <Section backgroundColor={backgroundColor}>
      <Container size={width}>
        <div
          className="p-[30px] rounded-[5px] bg-white dark:bg-white/10 dark:border dark:border-white/30"
          style={{
            boxShadow:
              'rgb(0 0 0 / 10%) 0px 1px 3px 0px, rgb(0 0 0 / 5%) 0px 5px 15px 0px',
          }}
        >
          <div>
            <Text
              renderBlock={(props) => (
                <h3
                  className={classNames(
                    'mb-1 font-bold leading-5',
                    textColors.GRAY_800
                  )}
                  {...props.attributes}
                >
                  {props.children}
                </h3>
              )}
              placeholder="type a title..."
              propName="title"
              value={title}
            />
            <RichText
              propName="text"
              placeholder="Type a text..."
              renderBlock={(props) => (
                <span
                  className="text-sm leading-6 dark:text-gray-300"
                  {...props.attributes}
                >
                  {props.children}
                </span>
              )}
              value={text}
            />
          </div>
          <div className="block items-center mt-3 sm:flex">
            <GoogleReCaptchaProvider reCaptchaKey={reCaptchaKey}>
              <NewsletterSubscribeForm
                buttonText={buttonText}
                formId={formId}
                resultOkText={resultOkText}
              />
            </GoogleReCaptchaProvider>
            <div>
              <RichText
                propName="text2"
                placeholder="Type a text..."
                renderBlock={({ children }) => (
                  <p className="text-gray-500 dark:text-gray-300 text-sm leading-[18px] min-w-[100px]">
                    {children}
                  </p>
                )}
                value={text2}
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}

Newsletter.schema = {
  name: blockNames.NewsletterSubscribe,
  label: 'Newsletter subscribe',
  category: 'call to action',
  hideFromAddMenu: false,
  previewImageUrl: `/bricks-preview-images/${blockNames.NewsletterSubscribe}.png`,
  playgroundLinkLabel: 'View source code on Github',
  playgroundLinkUrl:
    'https://github.com/ReactBricks/reactbricks-starters/blob/main/packages/reactbricks-ui/astro/src/cta/NewsletterSubscribe/NewsletterSubscribe.tsx',
  getDefaultProps: () => ({
    ...sectionDefaults,
    width: 'small',
    title: 'Join our newsletter',
    text: 'Never miss our release and new blog articles.',
    text2: '6,500 developers and counting',
    buttonText: 'Join',
    mailchimpUrl: '',
    resultOkText: '',
  }),
  sideEditProps: [
    {
      groupName: 'Form data',
      defaultOpen: true,
      props: [
        neutralBackgroundColorsEditProps,
        containerSizeEditProps,
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
      ],
    },
  ],
  astroInteractivity: 'idle',
}

export default Newsletter
