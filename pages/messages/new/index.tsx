import './styles.module.scss';
import Page from 'components/Page';
import { getUser, signIn } from 'modules/client/users';
import type { FormikHelpers } from 'formik';
import { Field, Form, Formik } from 'formik';
import { useCallback } from 'react';
import { useLeaveConfirmation } from 'modules/client/forms';
import Box from 'components/Box';
import BoxFooter from 'components/Box/BoxFooter';
import Button from 'components/Button';
import type { APIClient } from 'modules/client/api';
import api from 'modules/client/api';
import Label from 'components/Label';
import BBCodeField from 'components/BBCode/BBCodeField';
import BoxSection from 'components/Box/BoxSection';
import { Dialog } from 'modules/client/dialogs';
import UserField from 'components/UserField';

type MessagesAPI = APIClient<typeof import('pages/api/messages').default>;

const initialValues = {
	to: [],
	subject: '',
	content: ''
};

type Values = typeof initialValues;

const Component = () => (
	<Page flashyTitle heading="Messages">
		<Formik
			initialValues={initialValues}
			onSubmit={
				useCallback(async (
					values: Values,
					{ setSubmitting }: FormikHelpers<Values>
				) => {
					if (!getUser()) {
						setSubmitting(false);

						if (await Dialog.confirm({
							id: 'send-message',
							title: 'Send Message',
							content: "Sign in to send your message!\n\n(Don't worry, your message won't be lost if you don't leave the page.)",
							actions: ['Sign In', 'Cancel']
						})) {
							signIn();
						}

						return;
					}

					(api as MessagesAPI).post('/messages', values);
				}, [])
			}
		>
			{({ isSubmitting, dirty }) => {
				// This ESLint comment is necessary because ESLint is empirically wrong here.
				// eslint-disable-next-line react-hooks/rules-of-hooks
				useLeaveConfirmation(dirty);

				return (
					<Form>
						<Box>
							<BoxSection heading="New Message">
								<div className="field-container">
									<Label htmlFor="field-to">
										To
									</Label>
									<UserField
										name="to"
										required
										autoFocus
									/>
								</div>
								<div className="field-container">
									<Label htmlFor="field-subject">
										Subject
									</Label>
									<Field
										id="field-subject"
										name="subject"
										required
										autoFocus
										maxLength={50}
										autoComplete="off"
									/>
								</div>
								<div className="field-container">
									<Label htmlFor="field-description">
										Content
									</Label>
									<BBCodeField
										name="content"
										required
										rows={16}
										maxLength={20000}
									/>
								</div>
							</BoxSection>
							<BoxFooter>
								<Button
									type="submit"
									className="alt"
									disabled={isSubmitting}
								>
									Send
								</Button>
							</BoxFooter>
						</Box>
					</Form>
				);
			}}
		</Formik>
	</Page>
);

export default Component;