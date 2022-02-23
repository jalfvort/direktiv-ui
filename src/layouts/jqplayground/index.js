import { useJQPlayground } from 'direktiv-react-hooks';
import { useCallback, useEffect, useState } from 'react';
import { VscFileCode, VscArrowRight } from 'react-icons/vsc';
import Button from '../../components/button';
import ContentPanel, { ContentPanelBody, ContentPanelTitle, ContentPanelTitleIcon } from '../../components/content-panel';
import DirektivEditor from '../../components/editor';
import Alert from '../../components/alert';
import FlexBox from '../../components/flexbox';
import HelpIcon from '../../components/help';
import { Config } from '../../util';
import './style.css';
import Drawflow from 'drawflow';
import { Resizable } from 're-resizable';
import styleDrawflow from 'drawflow/dist/drawflow.min.css'
import YAML from "json-to-pretty-yaml"
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

import { SchemaMap } from "./jsonSchema"
import Form from '@rjsf/core';
import { onSubmitCallbackMap, setConnections } from './util';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';

const ActionsNodes = [
    {
        name: 'StateNoop',
        family: "primitive",
        type: "noop",
        info: {
            description: "",
            longDescription: ``,
            link: ""
        },
        data: {
            schemaKey: 'stateSchemaNoop',
            formData: {}
        },
        html: 'Noop State'
    },
    {
        name: 'StateAction',
        family: "primitive",
        type: "action",
        info: {
            description: "The No-op State exists for when nothing more than generic state functionality is required.",
            longDescription: `The No-op State exists for when nothing more than generic state functionality is required. A common use-case would be to perform a jq operation on the state data without performing another operation.`
        },
        link: "https://docs.direktiv.io/v0.6.0/specification/#noopstate",
        data: {
            schemaKey: 'stateSchemaAction',
            formData: {}
        },
        html: 'Action State'
    },
    {
        name: 'StateSwitch',
        family: "primitive",
        type: "switch",
        info: {
            description: "The Action State runs another workflow as a subflow, or a function as defined in the forms action definition",
            longDescription: ``,
            link: "https://docs.direktiv.io/v0.6.0/specification/#actionstate"
        },
        data: {
            schemaKey: 'stateSchemaSwitch',
            formData: {}
        },
        html: 'Switch State'
    },
    {
        name: 'StartBlock',
        family: "special",
        type: "start",
        info: {
            description: "The Switch State is used to perform conditional transitions based on the current state information",
            longDescription: ``,
            link: "https://docs.direktiv.io/v0.6.0/specification/#switchstate"
        },
        data: {
            schemaKey: 'stateSchemaSwitch',
            formData: {}
        },
        html: 'Start Block'
    }
]


function Actions(props) {
    const cache = new CellMeasurerCache({
        fixedWidth: false,
        fixedHeight: true
    })

    function rowRenderer({ index, parent, key, style }) {
        return (
            <CellMeasurer
                key={key}
                cache={cache}
                parent={parent}
                columnIndex={0}
                rowIndex={index}
            >
                <div style={{ ...style, minHeight: "90px", height: "90px", cursor: "move", userSelect: "none", display: "flex" }}>
                    <div className={`action ${ActionsNodes[index].family} action-${ActionsNodes[index].type}`} draggable={true} node-index={index} onDragStart={(ev) => {
                        console.log("onDragStart = ", ev);
                        console.log("ev.target.getAttribute(node-index) = ", ev.target.getAttribute("node-index"))
                        ev.dataTransfer.setData("nodeIndex", ev.target.getAttribute("node-index"));
                    }}>
                        <div style={{ marginLeft: "5px" }}>
                            <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5", justifyContent: "space-between" }}>
                                <span style={{ whiteSpace: "pre-wrap", cursor: "move", fontSize: "13px" }}>
                                    {ActionsNodes[index].name}
                                </span>
                                <a style={{ whiteSpace: "pre-wrap", cursor: "pointer", fontSize: "11px", paddingRight: "3px" }} href={`${ActionsNodes[index].info.link}`} target="_blank">More Info</a>

                            </div>
                            <div style={{ fontSize: "10px", lineHeight: "10px", paddingTop: "2px" }}>
                                <p style={{ whiteSpace: "pre-wrap", cursor: "move", margin: "0px" }}>
                                    {ActionsNodes[index].info.description}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </CellMeasurer>
        );
    }

    return (
        <AutoSizer>
            {({ height, width }) => (
                <div style={{ height: "100%", minHeight: "100%" }}>
                    <List
                        width={width}
                        height={height}
                        rowRenderer={rowRenderer}
                        deferredMeasurementCache={cache}
                        scrollToIndex={0}
                        rowCount={ActionsNodes.length}
                        rowHeight={90}
                        scrollToAlignment={"start"}
                    />
                </div>
            )}
        </AutoSizer>
    )
}

export default function JQPlayground() {
    const [diagramEditor, setDiagramEditor] = useState(null);
    const [selectedNode, setSelectedNode] = useState(0);
    const [formRef, setFormRef] = useState(null);
    const [error, setError] = useState(null)

    const [actionDrawerWidth, setActionDrawerWidth] = useState(0)
    const [actionDrawerWidthOld, setActionDrawerWidthOld] = useState(200)
    const [actionDrawerMinWidth, setActionDrawerMinWidth] = useState(0)

    const [formDrawerWidth, setFormDrawerWidth] = useState(240)
    const [formDrawerWidthOld, setFormDrawerWidthOld] = useState(240)
    const [formDrawerMinWidth, setFormDrawerMinWidth] = useState(160)
    const [formDrawerAutoShow, setFormDrawerAutoShow] = useState(true)

    useEffect(() => {
        var id = document.getElementById("drawflow");
        console.log("id = ", id)
        if (!diagramEditor) {
            let editor = new Drawflow(id)
            editor.start()
            editor.on('nodeSelected', function (id) {
                setSelectedNode(id)
                let node = editor.getNodeFromId(id)
                console.log("XXX Node data =  ", node)
            })

            editor.on('nodeCreated', function (id) {
                let newNode = editor.getNodeFromId(id)
                newNode.data.id = `node-${id}-${newNode.data.type}`
                editor.updateNodeDataFromId(id, newNode.data)
            })

            editor.on('mouseUp', function (e) {
                // console.log("mouseUp event = ", e);
            })

            editor.on('nodeUnselected', function (e) {
                setSelectedNode(0)
                console.log("nodeUnselected event = ", e);
            })


            editor.addNode('StateNoop', 1, 1, 100, 100, "node primitive", { family: "primitive", type: "noop", schemaKey: 'stateSchemaNoop', formData: {} }, 'Noop State', false);
            editor.addNode('StateAction', 1, 1, 250, 200, "node primitive", { family: "primitive", type: "action", schemaKey: 'stateSchemaAction', formData: {} }, 'Action State', false);
            editor.addNode('StateSwitch', 1, 1, 350, 300, "node primitive", { family: "primitive", type: "switch", schemaKey: 'stateSchemaSwitch', formData: {} }, 'Switch State', false);
            editor.addNode('StartBlock', 0, 1, 1, 200, "node special start", { family: "special", type: "start", schemaKey: 'stateSchemaSwitch', formData: {} }, 'Start Block', false);

            setDiagramEditor(editor)
        }
    }, [diagramEditor])

    useEffect(() => {
        if (selectedNode === 0) {
            setFormDrawerMinWidth(0)
            setFormDrawerWidth(0)
        } else {
            console.log("formDrawerWidthOld = ", formDrawerWidthOld)
            setFormDrawerMinWidth(20)
            setFormDrawerWidth(formDrawerWidthOld)
        }
    }, [selectedNode, formDrawerWidthOld])

    const resizeStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        flexDirection: "column",
        background: "#f0f0f0",
        zIndex: 30,
    };

    return (
        <>
            <FlexBox id="builder-page" className="col gap" style={{ paddingRight: "8px" }}>
                {error ?
                    <Alert className="critical">{error} </Alert>
                    :
                    <></>
                }
                {/* <div style={{height:"600px", width: "600px"}}> */}
                <div className='toolbar'>
                    <div className='btn' onClick={() => {
                        //TODO: Split into another function
                        //TODO: Export to non-destructive json ✓
                        let rawExport = diagramEditor.export()
                        let rawData = rawExport.drawflow.Home.data
                        let wfData = { states: [] }
                        //TODO: 
                        // - Find Start Block ✓
                        // - Check if there are multiple start blocks
                        const startBlockIDs = diagramEditor.getNodesFromName("StartBlock")
                        console.log("startBlockIDs = ", startBlockIDs)
                        let startBlock = rawData[startBlockIDs[0]];
                        let startState

                        // Find Start State
                        for (const outputID in startBlock.outputs) {
                            if (Object.hasOwnProperty.call(startBlock.outputs, outputID)) {
                                const output = startBlock.outputs[outputID];
                                console.log("--> Found output = ", output)
                                // TODO: handle to connections in start
                                console.log("output.connections = ", output.connections)
                                startState = rawData[output.connections[0].node]
                                console.log("--> Found startState = ", startState)
                                break
                            }
                        }

                        // Set Transitions
                        console.log(" rawData = ", rawData)
                        setConnections(startState.id, startBlock.id, rawData, wfData)
                        wfData.states.reverse()

                        console.log("wfData = ", wfData)
                        console.log("---- Workflow ---")
                        console.log(YAML.stringify(wfData))

                    }}>
                        <div>Export</div>
                    </div>
                    <div className='btn' onClick={() => {
                        if (actionDrawerMinWidth === 0) {
                            setActionDrawerMinWidth(20)
                            setActionDrawerWidth(actionDrawerWidthOld)
                        } else {
                            setActionDrawerMinWidth(0)
                            setActionDrawerWidth(0)
                        }
                    }}>
                        <div>{actionDrawerMinWidth === 0 ? "Show Actions" : "Hide Actions"}</div>
                    </div>
                    <div className='btn' onClick={() => {
                        if (formDrawerMinWidth === 0) {
                            setFormDrawerMinWidth(20)
                            setFormDrawerWidth(formDrawerWidthOld)
                        } else {
                            setFormDrawerMinWidth(0)
                            setFormDrawerWidth(0)
                        }
                    }}>
                        <div>{formDrawerMinWidth === 0 ? "Show Details" : "Hide Details"}</div>
                    </div>
                    <div className='btn' onClick={() => {
                        if (formDrawerMinWidth === 0) {
                            setFormDrawerMinWidth(20)
                            setFormDrawerWidth(formDrawerWidthOld)
                        } else {
                            setFormDrawerMinWidth(0)
                            setFormDrawerWidth(0)
                        }
                    }}>
                        <div>Auto Show Details</div>
                    </div>
                </div>
                <FlexBox style={{ margin: "5px", borderRadius: "16px", overflow: "hidden", boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px" }}>
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            overflow: 'hidden',
                        }}
                    >
                        <Resizable
                            style={{ ...resizeStyle, pointerEvents: actionDrawerWidth === 0 ? "none" : "", opacity: actionDrawerWidth === 0 ? 0 : 100 }}
                            size={{ width: actionDrawerWidth, height: "100%" }}
                            onResizeStop={(e, direction, ref, d) => {
                                setActionDrawerWidthOld(actionDrawerWidth + d.width)
                                setActionDrawerWidth(actionDrawerWidth + d.width)
                            }}
                            maxWidth="40%"
                            minWidth={actionDrawerMinWidth}
                        >
                            <div className={"panel left"} style={{ display: "flex" }}>
                                <div style={{ width: "100%", margin: "10px" }}>
                                    <Actions />
                                </div>

                            </div>
                        </Resizable>
                        <div id="drawflow" style={{ height: "100%", width: "100%" }}
                            onDrop={(ev) => {
                                console.log("onDrop event = ", ev)
                                ev.preventDefault();
                                var nodeIndex = ev.dataTransfer.getData("nodeIndex");
                                console.log("event data = ", nodeIndex)

                                let pos_x = ev.clientX
                                let pos_y = ev.clientY
                                const newNode = ActionsNodes[nodeIndex]

                                pos_x = pos_x * (diagramEditor.precanvas.clientWidth / (diagramEditor.precanvas.clientWidth * diagramEditor.zoom)) - (diagramEditor.precanvas.getBoundingClientRect().x * (diagramEditor.precanvas.clientWidth / (diagramEditor.precanvas.clientWidth * diagramEditor.zoom)));
                                pos_y = pos_y * (diagramEditor.precanvas.clientHeight / (diagramEditor.precanvas.clientHeight * diagramEditor.zoom)) - (diagramEditor.precanvas.getBoundingClientRect().y * (diagramEditor.precanvas.clientHeight / (diagramEditor.precanvas.clientHeight * diagramEditor.zoom)));
                                diagramEditor.addNode(newNode.name, 1, 1, pos_x, pos_y, `node ${newNode.family}`, { family: newNode.family, type: newNode.type, ...newNode.data }, newNode.html, false)
                                // addNodeToDrawFlow(data, ev.clientX, ev.clientY);
                            }}
                            onDragOver={(ev) => {
                                ev.preventDefault(ev);
                                // console.log("onDragOver event = ", ev)
                            }}
                        >
                        </div>
                        <Resizable
                            style={{ ...resizeStyle, pointerEvents: formDrawerWidth === 0 ? "none" : "", opacity: formDrawerWidth === 0 ? 0 : 100 }}
                            onResizeStop={(e, direction, ref, d) => {
                                setFormDrawerWidthOld(formDrawerWidthOld + d.width)
                                setFormDrawerWidth(formDrawerWidth + d.width)
                            }}
                            size={{ width: formDrawerWidth, height: "100%" }}
                            maxWidth="40%"
                            minWidth={formDrawerMinWidth}
                        >
                            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderBottom: "1px solid #e5e5e5", paddingBottom: "6px", borderLeft: "7px solid rgb(131, 131, 131)", width: "100%" }}>
                                <h2 style={{ margin: "6px", textAlign: "center" }}>
                                    Switch State
                                </h2>
                                <div className='btn' style={{ backgroundColor: "pink", cursor: "pointer", paddingTop: "0px", paddingBottom: "0px" }} onClick={() => {
                                    formRef.click()
                                }}>
                                    Submit
                                </div>
                            </div>
                            <div className={"panel right"} style={{ flexDirection: "column" }}>
                                <div style={{ minHeight: "200px", maxHeight: "100%", height: "0px" }}>
                                    <Form
                                        id={"builder-form"}
                                        onSubmit={(form) => {
                                            console.log("form.formData = ", form.formData)

                                            // Update form data into node
                                            let node = diagramEditor.getNodeFromId(selectedNode)
                                            node.data.formData = form.formData
                                            console.log("!!!node!#@!$!@$@! = ", node)
                                            diagramEditor.updateNodeDataFromId(selectedNode, node.data)

                                            // Do Custom callback logic if it exists for data type
                                            let onSubmitCallback = onSubmitCallbackMap[node.name]
                                            if (onSubmitCallback) {
                                                onSubmitCallback(node, diagramEditor)
                                                return
                                            }
                                        }}
                                        schema={selectedNode !== 0 ? SchemaMap[diagramEditor.getNodeFromId(selectedNode).data.schemaKey] : {}}
                                        formData={selectedNode !== 0 ? diagramEditor.getNodeFromId(selectedNode).data.formData : {}}
                                    >
                                        <button ref={setFormRef} style={{ display: "none" }} />
                                    </Form>
                                </div>
                            </div>
                        </Resizable>
                    </div>
                </FlexBox>
                {/* </div> */}
            </FlexBox>
        </>
    )
}

export function BackupJQPlayground() {

    const [filter, setFilter] = useState(localStorage.getItem('jqFilter') ? localStorage.getItem('jqFilter') : ".")
    const [input, setInput] = useState(localStorage.getItem('jqInput') ? localStorage.getItem('jqInput') : JSON.stringify({}, null, 2))
    const [error, setError] = useState(null)



    const { data, err, executeJQ, cheatSheet } = useJQPlayground(Config.url, localStorage.getItem("apikey"))

    const executeAndSave = useCallback((...args) => {
        localStorage.setItem('jqInput', input)
        localStorage.setItem('jqFilter', filter)
        executeJQ(...args)
    }, [executeJQ, filter, input])

    // Save state every 2 seconds
    useEffect(() => {
        if (filter == null || input == null) {
            return
        }

        let timer = setInterval(async () => {
            localStorage.setItem('jqInput', input)
            localStorage.setItem('jqFilter', filter)
        }, 2000)

        return function cleanup() {
            clearInterval(timer)
        }
    }, [filter, input])


    useEffect(() => {
        setError(err)
    }, [err])

    return (
        <FlexBox id="jq-page" className="col gap" style={{ paddingRight: "8px" }}>
            <JQFilter data={input} query={filter} error={error} setFilter={setFilter} executeJQ={executeAndSave} setError={setError} />
            <FlexBox className="gap col" >
                <FlexBox className="gap wrap">
                    <FlexBox style={{ minWidth: "380px" }}>
                        <JQInput input={input} setInput={setInput} />
                    </FlexBox>
                    <FlexBox style={{ minWidth: "380px" }}>
                        <JQOutput data={data} />
                    </FlexBox>
                </FlexBox>
            </FlexBox>
            <FlexBox className="gap col" >
                <FlexBox className="gap box-wrap">
                    <HowToJQ />
                    <ExamplesJQ cheatSheet={cheatSheet} setFilter={setFilter} setInput={setInput} executeJQ={executeAndSave} />
                </FlexBox>
            </FlexBox>
        </FlexBox>
    )
}

function HowToJQ() {
    return (
        <FlexBox className="how-to-jq">
            <ContentPanel style={{ width: "100%" }}>
                <ContentPanelTitle>
                    <ContentPanelTitleIcon>
                        <VscFileCode />
                    </ContentPanelTitleIcon>
                    <FlexBox className="gap" style={{ alignItems: "center" }}>
                        <div>
                            How it works
                        </div>
                        <HelpIcon msg={"Brief instructions on how JQ Playground works"} />
                    </FlexBox>
                </ContentPanelTitle>
                <ContentPanelBody>
                    <FlexBox className="col gap" style={{ fontSize: "10pt" }}>
                        <span style={{ fontWeight: "bold" }}>JQ Playground is an envrioment where you can quickly test your jq commands against JSON.</span>
                        <span>There are two inputs in the playground:</span>
                        <ul>
                            <li><span style={{ fontWeight: "bold" }}>Filter</span> - This is the jq command that will be used to transform your JSON input</li>
                            <li><span style={{ fontWeight: "bold" }}>JSON</span> - This is the JSON input that will be transformed</li>
                        </ul>
                        <div>
                            The transformed JSON is shown in the Result output field.
                        </div>
                        <div>
                            For information on the JQ syntax, please refer to the offical JQ manual online.
                        </div>
                        <Button className="reveal-btn small shadow">
                            <FlexBox className="gap">
                                <VscArrowRight className="auto-margin" />
                                <a href="https://stedolan.github.io/jq/manual/">
                                    View JQ Manual
                                </a>
                            </FlexBox>
                        </Button>
                    </FlexBox>
                </ContentPanelBody>
            </ContentPanel>
        </FlexBox>
    )
}

function ExamplesJQ(props) {
    const { cheatSheet, setFilter, setInput, executeJQ } = props

    async function loadJQ(f, i) {
        setFilter(f)
        setInput(JSON.stringify(JSON.parse(i), null, 2))
        await executeJQ(f, btoa(i))
    }

    const half = Math.ceil(cheatSheet.length / 2);

    const firstHalf = cheatSheet.slice(0, half)
    const secondHalf = cheatSheet.slice(-half)

    return (
        <FlexBox style={{ flex: 2 }}>
            <ContentPanel style={{ minHeight: "280px", width: "100%" }}>
                <ContentPanelTitle>
                    <ContentPanelTitleIcon>
                        <VscFileCode />
                    </ContentPanelTitleIcon>
                    <FlexBox className="gap" style={{ alignItems: "center" }}>
                        <div>
                            Cheatsheet
                        </div>
                        <HelpIcon msg={"A list of examples that you can load into the playground"} />
                    </FlexBox>
                </ContentPanelTitle>
                <ContentPanelBody >

                    <table style={{ width: "50%", fontSize: "10pt" }}>
                        <tbody>
                            {firstHalf.map((obj) => {
                                return (
                                    <tr>
                                        <td className="jq-example" style={{ width: "25%" }}>
                                            {obj.example}
                                        </td>
                                        <td>
                                            {obj.tip}
                                        </td>
                                        <td style={{ width: "20%" }} onClick={() => loadJQ(obj.filter, obj.json)}>
                                            <Button className="reveal-btn small shadow">
                                                <FlexBox className="gap">
                                                    <VscFileCode className="auto-margin" />
                                                    <div>
                                                        Load
                                                    </div>
                                                </FlexBox>
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>

                    </table>
                    <table style={{ width: "50%", fontSize: "10pt" }}>
                        <tbody>
                            {secondHalf.map((obj) => {
                                return (
                                    <tr>
                                        <td style={{ width: "25%" }} className="jq-example">
                                            {obj.example}
                                        </td>
                                        <td>
                                            {obj.tip}
                                        </td>
                                        <td style={{ width: "20%" }} onClick={() => loadJQ(obj.filter, obj.json)}>
                                            <Button className="reveal-btn small shadow">
                                                <FlexBox className="gap">
                                                    <VscFileCode className="auto-margin" />
                                                    <div>
                                                        Load
                                                    </div>
                                                </FlexBox>
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </ContentPanelBody>
            </ContentPanel>
        </FlexBox>
    )
}

function JQOutput(props) {
    const { data } = props

    const [output, setOutput] = useState("")

    useEffect(() => {
        if (data !== output) {
            if (data) {
                setOutput(data.toString())
            }
        }
    }, [data, output])

    return (
        <ContentPanel style={{ width: "100%" }}>
            <ContentPanelTitle>
                <ContentPanelTitleIcon>
                    <VscFileCode />
                </ContentPanelTitleIcon>
                <FlexBox className="gap" style={{ alignItems: "center" }}>
                    <div>
                        Output
                    </div>
                    <HelpIcon msg={"The output of the JQ query"} />
                </FlexBox>
            </ContentPanelTitle>
            <ContentPanelBody >
                <FlexBox style={{ overflow: "hidden", height: "422px", maxHeight: "422px" }}>
                    <DirektivEditor readonly={true} value={output} dlang={"json"} />
                </FlexBox>
            </ContentPanelBody>
        </ContentPanel>
    )
}

function JQInput(props) {
    const { input, setInput } = props
    return (
        <ContentPanel style={{ width: "100%" }}>
            <ContentPanelTitle>
                <ContentPanelTitleIcon>
                    <VscFileCode />
                </ContentPanelTitleIcon>
                <FlexBox className="gap" style={{ alignItems: "center" }}>
                    <div>
                        Input
                    </div>
                    <HelpIcon msg={"The input to feed the JQ query"} />
                </FlexBox>
            </ContentPanelTitle>
            <ContentPanelBody >
                <FlexBox style={{ overflow: "hidden", height: "422px", maxHeight: "422px" }}>
                    <DirektivEditor readonly={false} value={input} setDValue={setInput} dlang={"json"} />
                </FlexBox>
            </ContentPanelBody>
        </ContentPanel>
    )
}

function JQFilter(props) {
    const { data, setFilter, setError, executeJQ, query, error } = props

    async function execute() {
        setError(null)
        // setFilter("")
        try {
            const result = await executeJQ(query, btoa(data))
            return {
                error: false,
                data: result
            }
        } catch (e) {
            setError(e.toString())
            return {
                error: true,
                msg: e.toString()
            }
        }

    }


    return (
        <FlexBox style={{ maxHeight: "205px" }}>
            <ContentPanel style={{ width: "100%" }}>
                <ContentPanelTitle>
                    <ContentPanelTitleIcon>
                        <VscFileCode />
                    </ContentPanelTitleIcon>
                    <FlexBox className="gap" style={{ alignItems: "center" }}>
                        <div>
                            JQ Filter
                        </div>
                        <HelpIcon msg={"A simple JQ playground to test your queries"} />
                    </FlexBox>
                </ContentPanelTitle>
                <ContentPanelBody >
                    <FlexBox className="gap wrap" style={{ height: "40px" }}>
                        <FlexBox style={{ fontSize: "12pt" }} >
                            <input style={{ height: "28px", width: "100%" }} onChange={(e) => setFilter(e.target.value)} value={query} placeholder={"Enter a Filter to JQ on"} type="text" />
                        </FlexBox>
                        <FlexBox style={{ maxWidth: "65px" }}>

                            <Button className="small" onClick={() => execute()}>
                                Execute
                            </Button>
                        </FlexBox>
                    </FlexBox>
                </ContentPanelBody>
                <FlexBox>
                    {error ? <Alert className="error-message"><div><span>error executing JQ command:</span>{error.replace("execute jq: error executing JQ command:", "")}</div></Alert> : null}
                </FlexBox>
            </ContentPanel>
        </FlexBox>
    )
}