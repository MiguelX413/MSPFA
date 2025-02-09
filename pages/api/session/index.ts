import validate from './index.validate';
import type { APIHandler } from 'lib/server/api';
import users, { getPrivateUser } from 'lib/server/users';
import type { ServerUser } from 'lib/server/users';
import type { ExternalAuthMethodOptions, InternalAuthMethodOptions } from 'lib/client/auth';
import getAuthMethodInfo from 'lib/server/auth/getAuthMethodInfo';
import createSession from 'lib/server/auth/createSession';
import { getCredentials, verifyCredentials } from 'lib/server/auth/authenticate';
import verifyPassword, { VerifyPasswordResult } from 'lib/server/auth/verifyPassword';
import type { PrivateUser } from 'lib/client/users';
import type { EmailString } from 'lib/types';

export type SessionBody = {
	authMethod: ExternalAuthMethodOptions,
	email?: never
} | {
	authMethod: InternalAuthMethodOptions,
	email: EmailString
};

const Handler: APIHandler<(
	{
		method: 'DELETE'
	} | {
		method: 'POST',
		body: SessionBody
	}
), {
	method: 'POST',
	body: PrivateUser
}> = async (req, res) => {
	await validate(req, res);

	if (req.method === 'POST') {
		let user: ServerUser | undefined | null;

		if (req.body.authMethod.type === 'password') {
			const email = req.body.email!.toLowerCase();

			user = await users.findOne({
				$or: [
					{ email },
					{ unverifiedEmail: email }
				]
			});

			if (!user) {
				res.status(404).send({
					message: 'No user was found with the specified email.'
				});
				return;
			}

			await verifyPassword(res, user, req.body.authMethod.value, {
				[VerifyPasswordResult.NotFound]: 401,
				[VerifyPasswordResult.Incorrect]: 401
			});
		} else {
			const { authMethod } = await getAuthMethodInfo(req, res, req.body.authMethod);

			user = await users.findOne({
				'authMethods.id': authMethod.id
			});

			if (!user) {
				res.status(404).send({
					message: 'No user was found with the specified sign-in method.'
				});
				return;
			}

			// If the auth method's `name` is outdated, update it.
			if ((
				user.authMethods.find(({ id }) => id === authMethod.id)
			)!.name !== authMethod.name) {
				users.updateOne({
					'_id': user._id,
					'authMethods.id': authMethod.id
				}, {
					$set: {
						'authMethods.$.name': authMethod.name
					}
				});
			}
		}

		// Authentication succeeded.

		const session = await createSession(req, res, user);

		res.status(session ? 201 : 403).send(getPrivateUser(user));
		return;
	}

	req.method satisfies 'DELETE';

	const credentials = getCredentials(req, res);

	if (!credentials) {
		res.status(422).send({
			message: 'The specified session\'s credentials are invalid.'
		});
		return;
	}

	const user = await verifyCredentials(credentials);

	if (!user) {
		res.status(404).send({
			message: 'No valid session was found to sign out of.'
		});
		return;
	}

	await users.updateOne({
		_id: user._id
	}, {
		$pull: {
			sessions: {
				token: credentials.token
			}
		}
	});

	credentials.cookies?.set('auth', undefined);

	res.status(204).end();
};

export default Handler;
