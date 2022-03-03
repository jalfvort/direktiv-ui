export const NodeStartBlock = {
    name: 'StartBlock',
    family: "special",
    type: "start",
    info: {
        description: "DEBUG",
        longDescription: `DEBUG`,
        link: ""
    },
    data: {
        schemaKey: 'stateSchemaSwitch',
        formData: {}
    },
    connections: {
        input: 0,
        output: 1
    },
    html: 'Start Block'
}


export const NodeStateAction = {
    name: 'StateAction',
    family: "primitive",
    type: "action",
    info: {
        description: "The Action State runs another workflow as a subflow, or a function as defined in the forms action definition",
        longDescription: ``,
        link: "https://docs.direktiv.io/v0.6.0/specification/#actionstate"
    },
    data: {
        schemaKey: 'stateSchemaAction',
        formData: {}
    },
    connections: {
        input: 1,
        output: 1
    },
    html: 'Action State'
}



export const ActionsNodes = [
    {
        name: 'StateNoop',
        family: "primitive",
        type: "noop",
        info: {
            description: "The No-op State exists for when nothing more than generic state functionality is required.",
            longDescription: `The No-op State exists for when nothing more than generic state functionality is required. A common use-case would be to perform a jq operation on the state data without performing another operation.`,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaNoop',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'Noop State'
    },
    {
        name: 'StateConsumeEvent',
        family: "primitive",
        type: "consumeEvent",
        info: {
            description: "todo",
            longDescription: `todo`,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaConsumeEvent',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'Consume Event State'
    },
    {
        name: 'StateSchemaDelay',
        family: "primitive",
        type: "delay",
        info: {
            description: "todo",
            longDescription: `todo`,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaDelay',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'Delay State'
    },
    {
        name: 'StateError',
        family: "primitive",
        type: "error",
        info: {
            description: "todo",
            longDescription: `todo`,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaError',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'Error State'
    },
    {
        name: 'StateEventAnd',
        family: "primitive",
        type: "eventAnd",
        info: {
            description: "todo",
            longDescription: `todo`,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaEventAnd',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'EventAnd State'
    },
    {
        name: 'StateEventXor',
        family: "primitive",
        type: "eventXor",
        info: {
            description: "todo",
            longDescription: `todo`,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaEventXor',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'EventXor State'
    },
    {
        name: 'StateForeach',
        family: "primitive",
        type: "foreach",
        info: {
            description: "todo",
            longDescription: `todo`,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaForeach',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'Foreach State'
    },
    {
        name: 'StateGenerateEvent',
        family: "primitive",
        type: "generateEvent",
        info: {
            description: "todo",
            longDescription: `todo`,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaGenerateEvent',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'Generate Event State'
    },
    {
        name: 'StateGetter',
        family: "primitive",
        type: "getter",
        info: {
            description: "todo",
            longDescription: `todo`,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaGetter',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'Getter State'
    },
    {
        name: 'StateSetter',
        family: "primitive",
        type: "setter",
        info: {
            description: "todo",
            longDescription: `todo`,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaSetter',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'Setter State'
    },
    NodeStateAction,
    {
        name: 'StateValidate',
        family: "primitive",
        type: "validate",
        info: {
            description: "todo",
            longDescription: `todo`,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaValidate',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'Validate State'
    },
    {
        name: 'StateSwitch',
        family: "primitive",
        type: "switch",
        info: {
            description: "The Switch State is used to perform conditional transitions based on the current state information",
            longDescription: ``,
            link: "https://docs.direktiv.io/v0.6.0/specification/#switchstate"
        },
        data: {
            schemaKey: 'stateSchemaSwitch',
            formData: {}
        },
        connections: {
            input: 1,
            output: 1
        },
        html: 'Switch State'
    },
    NodeStartBlock
]
