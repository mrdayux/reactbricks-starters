import classNames from 'classnames'
import {
  fetchForms,
  Link,
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
import type { LayoutProps } from '../../LayoutSideProps'
import {
  backgroundColorsEditProps,
  sectionBordersEditProps,
  sectionDefaults,
  textGradientEditProps,
} from '../../LayoutSideProps'
import blockNames from '../../blockNames'
import { gradients, textColors } from '../../colors'
import {
  createSubmissionError,
  type FormSubmissionError,
} from '../../shared/FormNewsletter/NewsletterUtils'
import Container from '../../shared/components/Container'
import Section from '../../shared/components/Section'

export interface CallToActionProps extends LayoutProps {
  textGradient: keyof typeof gradients
  title: types.TextValue
  description: types.TextValue
  text: types.TextValue
  buttonText: types.TextValue
  privacy: types.TextValue
  formId: string
}

const NewsletterHeroForm: React.FC<{
  buttonText: types.TextValue
  formId: string
}> = ({ buttonText, formId }) => {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const rbContext = useReactBricksContext()

  const { isAdmin } = useAdminContext()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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

  return (
    <form
      className="flex flex-col sm:flex-row"
      // onSubmit={handleSubmit(onSubmit)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <label className="relative">
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

        <input
          className="w-full md:w-auto bg-white focus:outline-hidden border-t border-l border-r sm:border-r-0 sm:border-b border-gray-300 focus:border-sky-500 rounded-t-md sm:rounded-tr-none sm:rounded-l-md py-2 px-4 appearance-none leading-normal pl-10"
          type="email"
          placeholder="Your email address"
          id="emailAddress"
          {...register('email', {
            required: 'Email is required',
          })}
        />
      </label>
      <button
        type="submit"
        className="bg-sky-500 px-6 rounded-b-md sm:rounded-bl-none sm:rounded-r-md text-white font-bold py-2 whitespace-nowrap w-full md:w-auto min-w-[80px]"
        disabled={isAdmin || isSubmitting}
        // style={{ backgroundColor: '#2f9ff4' }}
      >
        <Text
          propName="buttonText"
          value={buttonText}
          placeholder="Action..."
          renderBlock={({ children }) => (
            <span className="text-center">{children}</span>
          )}
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

const CallToAction: types.Brick<CallToActionProps> = ({
  backgroundColor,
  borderTop,
  borderBottom,
  paddingTop,
  paddingBottom,
  textGradient = gradients.NONE.value,
  title,
  description,
  text,
  buttonText,
  privacy,
  formId,
}) => {
  const titleStyle =
    textGradient !== gradients.NONE.value
      ? { WebkitTextFillColor: 'transparent' }
      : {}

  const reCaptchaKey = import.meta.env.PUBLIC_RECAPTCHA_KEY || ''

  return (
    <Section
      backgroundColor={backgroundColor}
      borderTop={borderTop}
      borderBottom={borderBottom}
    >
      <Container
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
        className={classNames(
          'flex flex-col lg:flex-row lg:gap-20 items-start text-left'
        )}
      >
        <div className="flex-1 lg:pr-14 mb-4 lg:mb-0">
          <div className="mb-4" style={titleStyle}>
            <Text
              propName="title"
              value={title}
              renderBlock={(props) => (
                <h2
                  className={classNames(
                    'font-bold text-[32px] leading-tight md:text-4xl xl:text-5xl bg-clip-text bg-linear-to-r',
                    textColors.GRAY_900,
                    gradients[textGradient].className
                  )}
                  {...props.attributes}
                >
                  {props.children}
                </h2>
              )}
              placeholder="Call to action text"
            />
          </div>
          <RichText
            propName="description"
            value={description}
            renderBlock={(props) => (
              <p
                className={classNames('text-sm', textColors.GRAY_700)}
                {...props.attributes}
              >
                {props.children}
              </p>
            )}
            placeholder="Description"
            allowedFeatures={[types.RichTextFeatures.Bold]}
          />
        </div>
        <div className="flex-1">
          <div className="mb-6">
            <Text
              propName="text"
              value={text}
              renderBlock={(props) => (
                <span
                  className={classNames('leading-relaxed', textColors.GRAY_800)}
                  {...props.attributes}
                >
                  {props.children}
                </span>
              )}
              placeholder="Call to action text"
            />
          </div>
          <div>
            <GoogleReCaptchaProvider reCaptchaKey={reCaptchaKey}>
              <NewsletterHeroForm buttonText={buttonText} formId={formId} />
            </GoogleReCaptchaProvider>
            <div className="mt-2">
              <RichText
                propName="privacy"
                value={privacy}
                renderBlock={(props) => (
                  <span
                    className={classNames(
                      'text-xs leading-relaxed',
                      textColors.GRAY_500
                    )}
                    {...props.attributes}
                  >
                    {props.children}
                  </span>
                )}
                placeholder="Privacy..."
                allowedFeatures={[types.RichTextFeatures.Link]}
                renderLink={({ children, href, target, rel }) => (
                  <Link
                    href={href}
                    target={target}
                    rel={rel}
                    className="underline"
                  >
                    {children}
                  </Link>
                )}
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}

CallToAction.schema = {
  name: blockNames.NewsletterHero,
  label: 'Newsletter hero',
  playgroundLinkLabel: 'View source code on Github',
  category: 'call to action',
  tags: ['newsletter', 'subscribe', 'hero'],
  previewImageUrl: `/bricks-preview-images/${blockNames.NewsletterHero}.png`,
  playgroundLinkUrl:
    'https://github.com/ReactBricks/reactbricks-starters/blob/main/packages/reactbricks-ui/astro/src/cta/NewsletterHero/NewsletterHero.tsx',

  getDefaultProps: () => ({
    ...sectionDefaults,
    paddingTop: '12',
    paddingBottom: '12',
    title: 'Stay in the loop with our newsletter!',
    textGradient: gradients.NONE.value,
    description: [
      {
        type: 'paragraph',
        children: [
          {
            text: 'Sent every ',
          },
          {
            text: '2 weeks',
            bold: true,
          },
          {
            text: ', no spam.',
          },
        ],
      },
    ],
    text: 'Join thousands of developers who want to change the way people edit website.',
    privacy: [
      {
        type: 'paragraph',
        children: [
          {
            text: 'By submitting the form you accept our ',
          },
          {
            type: 'link',
            url: 'https://reactbricks.com/legal/privacy',
            children: [
              {
                text: 'Privacy policy',
              },
            ],
          },
        ],
      },
    ],
    buttonText: 'Subscribe',
  }),
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
      ],
    },
    {
      groupName: 'Title',
      defaultOpen: true,
      props: [textGradientEditProps],
    },
    {
      groupName: 'Layout',
      defaultOpen: false,
      props: [backgroundColorsEditProps, ...sectionBordersEditProps],
    },
  ],
}

export default CallToAction
