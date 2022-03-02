// COMMON

const CommonSchemaDefinitionConsumeEvent = {
    "type": "object",
    "title": "Event Definition",
    "description": "Event to consume.",
    "properties": {
        "type": {
            "type": "string",
            "title": "Type",
            "description": "CloudEvent type."
        },
        "context": {
            "type": "object",
            "title": "Context",
            "description": "Key value pairs for CloudEvent context values that must match.",
            "additionalProperties": {
                "type": "string"
            },
        }
    }
}

const CommonSchemaDefinitionTimeout = {
    "type": "string",
    "title": "Timeout",
    "description": "Duration to wait for action to complete (ISO8601)."
}

export const CommonSchemaDefinitionStateFields = {
    "transform": {
        "title": "Transform",
        "description": "jq command to transform the state's data output.",
        "type": "object",
        "properties": {
            "selectionType": {
                "enum": [
                    "JQ Query",
                    "Key Value",
                    "YAML"
                ],
                "default": "JQ Query"
            }
        },
        "allOf": [
            {
                "if": {
                    "properties": {
                        "selectionType": {
                            "const": "JQ Query"
                        }
                    }
                },
                "then": {
                    "properties": {
                        "jqQuery": {
                            "type": "string"
                        }
                    }
                }
            },
            {
                "if": {
                    "properties": {
                        "selectionType": {
                            "const": "YAML"
                        }
                    }
                },
                "then": {
                    "properties": {
                        "rawYAML": {
                            "title":"YAML",
                            "type": "string",
                            "description": "Raw YAML object representation of data.",
                        }
                    }
                }
            },
            {
                "if": {
                    "properties": {
                        "selectionType": {
                            "const": "Key Value"
                        }
                    }
                },
                "then": {
                    "properties": {
                        "keyValue": {
                            "type": "object",
                            "title": "Key Value",
                            "description": "Key Values representation of data.",
                            "additionalProperties": {
                                "type": "string"
                            },
                        }
                    }
                }
            }
        ]
    },
    "log": {
        "type": "string",
        "title": "Log",
        "description": "jq command to generate data for instance-logging."
    }
}

const CommonSchemaDefinitionAction = {
    "type": "object",
    "title": "Action Definition",
    "description": "Action to perform.",
    "properties": {
        "function": {
            "type": "string",
            "title": "Function",
            "description": "Name of the referenced function.",
            "examples": [
                "direktiv/request",
                "direktiv/python",
                "direktiv/smtp-receiver",
                "direktiv/sql",
                "direktiv/image-watermark"
            ]
        },
        "input": {
            ...CommonSchemaDefinitionStateFields.transform,
            "title": "Input",
            "description": "jq command to generate the input for the action."
        },
        "secrets": {
            "type": "array",
            "title": "Secrets",
            "description": "List of secrets to temporarily add to the state data under .secrets before running the input jq command.",
            "items": {
                "type": "string"
            }
        }
    }
}

// States

export const StateSchemaNoop = {
    "type": "object",
    "properties": {
        ...CommonSchemaDefinitionStateFields,
    }
}

export const StateSchemaConsumeEvent = {
    "type": "object",
    "required": [
        "event",
    ],
    "properties": {
        event: CommonSchemaDefinitionConsumeEvent,
        timeout: CommonSchemaDefinitionTimeout,
        ...CommonSchemaDefinitionStateFields,
    }
}

export const StateSchemaDelay = {
    "type": "object",
    "required": [
        "duration",
    ],
    "properties": {
        "duration": {
            "type": "string",
            "title": "Duration",
            "description": CommonSchemaDefinitionTimeout.description
        },
        ...CommonSchemaDefinitionStateFields,
    }
}

export const StateSchemaError = {
    "type": "object",
    "required": [
        "error",
        "message"
    ],
    "properties": {
        "error": {
            "type": "string",
            "title": "Error",
            "description": "Error code, catchable on a calling workflow.",
        },
        "message": {
            "type": "string",
            "title": "Message",
            "description": "Format string to provide more context to the error.",
        },
        "args": {
            "type": "string",
            "title": "Arguments",
            "description": "A list of jq commands to generate arguments for substitution in the message format string.",
        },
        ...CommonSchemaDefinitionStateFields,
    }
}

export const StateSchemaEventAnd = {
    "type": "object",
    "required": [
        "events",
    ],
    "properties": {
        "events": {
            "type": "array",
            "minItems": 1,
            "title": "Events",
            "description": "Events to consume.",
            "items": {
                "type": "object",
                "required": [
                    "event"
                ],
                "properties": {
                    "event": CommonSchemaDefinitionConsumeEvent,
                }
            }
        },
        ...CommonSchemaDefinitionStateFields,
    }
}

export const StateSchemaEventXor = {
    "type": "object",
    "required": [
        "events",
    ],
    "properties": {
        "events": {
            "type": "array",
            "minItems": 1,
            "title": "Events",
            "description": "Events to consume, and what to do based on which event was received.",
            "items": {
                "type": "object",
                "required": [
                    "event"
                ],
                "properties": {
                    "event": CommonSchemaDefinitionConsumeEvent,
                    "transform": CommonSchemaDefinitionStateFields.transform,
                }
            }
        },
        "log": CommonSchemaDefinitionStateFields.log,
    }
}

export const StateSchemaForeach = {
    "type": "object",
    "required": [
        "action",
        "args"
    ],
    "properties": {
        "array": {
            "type": "string",
            "title": "Array",
            "description": "jq command to produce an array of objects to loop through.",
        },
        "action": CommonSchemaDefinitionAction,
        "timeout": CommonSchemaDefinitionTimeout,
        ...CommonSchemaDefinitionStateFields,
    }
}

export const StateSchemaGenerateEvent = {
    "type": "object",
    "required": [
        "event",
    ],
    "properties": {
        "event": {
            "type": "object",
            "title": "Event Definition",
            "description": "Event to generate.",
            "required": [
                "type",
                "source"
            ],
            "properties": {
                "type": {
                    "type": "string",
                    "title": "Type",
                    "description": "CloudEvent type."
                },
                "source": {
                    "type": "string",
                    "title": "Source",
                    "description": "CloudEvent source."
                },
                "datacontenttype": {
                    "type": "string",
                    "title": "Data Content Type",
                    "description": "An RFC 2046 string specifying the payload content type."
                },
                "data": {
                    ...CommonSchemaDefinitionStateFields.transform,
                    "title": "Data",
                    "description": "Data to generate (payload) for the produced event."
                },
                "context": {
                    "type": "object",
                    "title": "Context",
                    "description": "Key value pairs for CloudEvent context values that must match.",
                    "additionalProperties": {
                        "type": "string"
                    },
                }
            }
        },
        ...CommonSchemaDefinitionStateFields
    }
}

export const StateSchemaGetter = {
    "type": "object",
    "required": [
        "variables"
    ],
    "properties": {
        "variables": {
            "type": "array",
            "title": "Variables",
            "description": "Variables to fetch.",
            "items": {
                "type": "object",
                "required": [
                    "key",
                    "scope"
                ],
                "properties": {
                    "key": {
                        "type": "string",
                        "title": "Key",
                        "description": "Variable name."
                    },
                    "scope": {
                        "title": "Scope",
                        "description": "Variable scope",
                        "enum": [
                            "workflow",
                            "instance",
                            "namespace"
                        ],
                        "default": "workflow"
                    },
                }
            }
        },
        ...CommonSchemaDefinitionStateFields,
    }
}

export const StateSchemaSetter = {
    "type": "object",
    "required": [
        "variables"
    ],
    "properties": {
        "variables": {
            "type": "array",
            "title": "Variables",
            "description": "Variables to push.",
            "items": {
                "type": "object",
                "required": [
                    "key",
                    "scope",
                    "value"
                ],
                "properties": {
                    "key": {
                        "type": "string",
                        "title": "Key",
                        "description": "Variable name."
                    },
                    "scope": {
                        "title": "Scope",
                        "description": "Variable scope",
                        "enum": [
                            "workflow",
                            "instance",
                            "namespace"
                        ],
                        "default": "workflow"
                    },
                    "value": {
                        ...CommonSchemaDefinitionStateFields.transform,
                        "title": "Value",
                        "description": "Value to generate variable value."
                    },
                    "mimeType": {
                        "type": "string",
                        "title": "Mime Type",
                        "description": "MimeType to store variable value as."
                    },
                }
            }
        },
        ...CommonSchemaDefinitionStateFields
    }
}

export const StateSchemaValidate = {
    "type": "object",
    "required": [
        "schema"
    ],
    "properties": {
        "subject": {
            "type": "string",
            "title": "Subject",
            "description": "jq command to select the subject of the schema validation. Defaults to '.' if unspecified."
        },
        "schema": {
            "type": "string",
            "title": "Schema",
            "description": "Name of the referenced state data schema."
        },
        ...CommonSchemaDefinitionStateFields,
    }
}


export const StateSchemaAction = {
    "type": "object",
    "properties": {
        "action": CommonSchemaDefinitionAction,
        "async": {
            "title": "Async",
            "description": "If workflow execution can continue without waiting for the action to return.",
            "type": "boolean"
        },
        "timeout": CommonSchemaDefinitionTimeout,
        ...CommonSchemaDefinitionStateFields,
    }
}

export const StateSchemaSwitch = {
    "type": "object",
    "required": [
        "conditions"
    ],
    "properties": {
        "conditions": {
            "type": "array",
            "minItems": 1,
            "title": "Conditions",
            "description": "Conditions to evaluate and determine which state to transition to next.",
            "items": {
                "type": "object",
                "required": [
                    "condition"
                ],
                "properties": {
                    "condition": {
                        "type": "string",
                        "title": "Condition",
                        "description": "jq command evaluated against state data. True if results are not empty."
                    },
                    "transform": {
                        "title": "Transform",
                        "description": "jq command to transform the state's data output.",
                        "type": "string"
                    }
                }
            },
            ...CommonSchemaDefinitionStateFields,
        }
    }
}


// Map to all Schemas
export const SchemaMap = {
    "stateSchemaNoop": StateSchemaNoop,
    "stateSchemaAction": StateSchemaAction,
    "stateSchemaSwitch": StateSchemaSwitch,
    "stateSchemaConsumeEvent": StateSchemaConsumeEvent,
    "stateSchemaDelay": StateSchemaDelay,
    "stateSchemaError": StateSchemaError,
    "stateSchemaEventAnd": StateSchemaEventAnd,
    "stateSchemaEventXor": StateSchemaEventXor,
    "stateSchemaForeach": StateSchemaForeach,
    "stateSchemaGenerateEvent": StateSchemaGenerateEvent,
    "stateSchemaGetter": StateSchemaGetter,
    "stateSchemaSetter": StateSchemaSetter,
    "stateSchemaValidate": StateSchemaValidate,
}