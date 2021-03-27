// This file is automatically generated by `scripts/generate-validators`. Do not edit directly.

import { createValidator } from 'modules/server/api';

export default createValidator({
	$schema: 'http://json-schema.org/draft-07/schema#',
	$ref: '#/definitions/Request',
	definitions: {
		Request: {
			anyOf: [
				{
					type: 'object',
					properties: {
						method: {
							type: 'string',
							const: 'DELETE'
						},
						body: {
							not: {}
						}
					},
					required: [
						'method'
					]
				},
				{
					type: 'object',
					properties: {
						method: {
							type: 'string',
							const: 'POST'
						},
						body: {
							$ref: '#/definitions/SessionBody'
						}
					},
					required: [
						'method',
						'body'
					]
				}
			]
		},
		SessionBody: {
			anyOf: [
				{
					type: 'object',
					properties: {
						authMethod: {
							$ref: '#/definitions/ExternalAuthMethod'
						}
					},
					required: [
						'authMethod'
					]
				},
				{
					type: 'object',
					properties: {
						email: {
							type: 'string',
							description: 'The following regular expression is explicitly copied from https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address.',
							pattern: "^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
						},
						authMethod: {
							type: 'object',
							properties: {
								type: {
									type: 'string',
									const: 'password'
								},
								value: {
									type: 'string',
									minLength: 8
								}
							},
							required: [
								'type',
								'value'
							]
						}
					},
					required: [
						'email',
						'authMethod'
					]
				}
			]
		},
		ExternalAuthMethod: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					enum: [
						'google',
						'discord'
					]
				},
				value: {
					type: 'string',
					minLength: 1
				}
			},
			required: [
				'type',
				'value'
			]
		}
	}
});