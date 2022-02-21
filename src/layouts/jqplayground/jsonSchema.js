// COMMON
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
            "type": "string",
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

// {
//     "type": "object",
//     "properties": {
//       "animal": {
//         "enum": [
//           "Cat",
//           "Fish"
//         ]
//       }
//     },
//     "allOf": [
//       {
//         "if": {
//           "properties": {
//             "animal": {
//               "const": "Cat"
//             }
//           }
//         },
//         "then": {
//           "properties": {
//             "food": {
//               "type": "string",
//               "enum": [
//                 "meat",
//                 "grass",
//                 "fish"
//               ]
//             }
//           },
//           "required": [
//             "food"
//           ]
//         }
//       },
//       {
//         "if": {
//           "properties": {
//             "animal": {
//               "const": "Fish"
//             }
//           }
//         },
//         "then": {
//           "properties": {
//             "food": {
//               "type": "string",
//               "enum": [
//                 "insect",
//                 "worms"
//               ]
//             },
//             "water": {
//               "type": "string",
//               "enum": [
//                 "lake",
//                 "sea"
//               ]
//             }
//           },
//           "required": [
//             "food",
//             "water"
//           ]
//         }
//       },
//       {
//         "required": [
//           "animal"
//         ]
//       }
//     ]
//   }
  
export const CommonSchemaDefinitionStateFields = {
    "transform": {
        "title": "Transform",
        "description": "jq command to transform the state's data output.",
        "type": "object",
        "properties": {
            "selectionType": {
                "enum": [
                    "jq",
                    "keyValue"
                ],
                "default": "jq"
            }
        },
        "allOf": [
            {
                "if": {
                    "properties": {
                        "transform":{
                        "selectionType": {
                            "const": "jq"
                        }}
                    }
                },
                "then": {
                    "properties": {
                        "jqQuery": {
                            "type": "string"
                        }
                    },
                    "required": [
                        "jqQuery"
                    ]
                }
            },
            {
                "if": {
                    "properties": {
                        "transform":{
                        "selectionType": {
                            "const": "keyValue"
                        }
                    }
                    }
                },
                "then": {
                    "properties": {
                        "keyValueZ": {
                            "type": "array",
                            "minItems": 1,
                            "title": "Key Value",
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
                            }
                        }
                    },
                    "required": [
                        "keyValueZ"
                    ]
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

// States

export const StateSchemaNoop = {
    "type": "object",
    "properties": {
        ...CommonSchemaDefinitionStateFields,
    }
}

export const StateSchemaAction = {
    "type": "object",
    "properties": {
        ...CommonSchemaDefinitionStateFields,
        "action": CommonSchemaDefinitionAction,
        "async": {
            "title": "Async",
            "description": "If workflow execution can continue without waiting for the action to return.",
            "type": "boolean"
        },
        "timeout": {
            "type": "string",
            "title": "Timeout",
            "description": "Duration to wait for action to complete (ISO8601)."
        }
    }
}

export const StateSchemaSwitch = {
    "type": "object",
    "required": [
        "conditions"
    ],
    "properties": {
        ...CommonSchemaDefinitionStateFields,
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
            }
        }
    }
}


// Map to all Schemas
export const SchemaMap = {
    "stateSchemaNoop": StateSchemaNoop,
    "stateSchemaAction":StateSchemaAction,
    "stateSchemaSwitch":StateSchemaSwitch
}