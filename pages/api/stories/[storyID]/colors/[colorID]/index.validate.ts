// This file is automatically generated by `scripts/generate-validators`. Do not edit directly.

import createAPIValidator from 'lib/server/api/createAPIValidator';

export default createAPIValidator({
	$schema: 'http://json-schema.org/draft-07/schema#',
	$ref: '#/definitions/RequestMethod',
	definitions: {
		RequestMethod: {
			type: 'string',
			enum: [
				'GET',
				'DELETE',
				'PATCH'
			]
		}
	}
}, {
	$schema: 'http://json-schema.org/draft-07/schema#',
	$ref: '#/definitions/Request',
	definitions: {
		Request: {
			anyOf: [
				{
					type: 'object',
					additionalProperties: false,
					properties: {
						body: {},
						query: {
							type: 'object',
							properties: {
								storyID: {
									type: 'string'
								},
								colorID: {
									type: 'string'
								}
							},
							required: [
								'storyID',
								'colorID'
							],
							additionalProperties: false
						},
						method: {
							type: 'string',
							const: 'GET'
						}
					},
					required: [
						'method',
						'query'
					]
				},
				{
					type: 'object',
					additionalProperties: false,
					properties: {
						body: {},
						query: {
							type: 'object',
							properties: {
								storyID: {
									type: 'string'
								},
								colorID: {
									type: 'string'
								}
							},
							required: [
								'storyID',
								'colorID'
							],
							additionalProperties: false
						},
						method: {
							type: 'string',
							const: 'DELETE'
						}
					},
					required: [
						'method',
						'query'
					]
				},
				{
					type: 'object',
					additionalProperties: false,
					properties: {
						body: {
							type: 'object',
							additionalProperties: false,
							properties: {
								group: {
									type: [
										'string',
										'null'
									],
									description: 'The ID of the color group which the color should be set into, or `null` if the color should be removed from any group.'
								},
								index: {
									$ref: '#/definitions/integer',
									description: 'The index in the `colors` array to move the specified color to.'
								},
								name: {
									type: 'string',
									minLength: 1,
									maxLength: 50
								},
								value: {
									type: 'string',
									minLength: 1,
									maxLength: 50
								}
							}
						},
						query: {
							type: 'object',
							properties: {
								storyID: {
									type: 'string'
								},
								colorID: {
									type: 'string'
								}
							},
							required: [
								'storyID',
								'colorID'
							],
							additionalProperties: false
						},
						method: {
							type: 'string',
							const: 'PATCH'
						}
					},
					required: [
						'body',
						'method',
						'query'
					]
				},
				{
					not: {}
				}
			]
		},
		integer: {
			type: 'integer'
		}
	}
});
