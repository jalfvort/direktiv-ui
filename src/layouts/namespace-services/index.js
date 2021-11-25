import { useNamespaceServices } from "direktiv-react-hooks";
import { IoChevronDownOutline, IoChevronForwardOutline, IoPlay } from "react-icons/io5";
import "./style.css"
import {useEffect, useState} from "react"
import { RiDeleteBin2Line } from "react-icons/ri";
import { FaCircle} from "react-icons/fa"
import ContentPanel, { ContentPanelBody, ContentPanelTitle, ContentPanelTitleIcon } from "../../components/content-panel";
import FlexBox from "../../components/flexbox";
import { Config } from "../../util";
import Modal, { ButtonDefinition, KeyDownDefinition } from "../../components/modal";
import AddValueButton from "../../components/add-button";
import {Link} from 'react-router-dom'
// import Slider, { SliderTooltip, Handle } from 'rc-slider';


export default function ServicesPanel(props) {
    const {namespace} = props

    if(!namespace) {
        return ""
    }
    return(
        <FlexBox className="gap wrap" style={{paddingRight:"8px"}}>
            <NamespaceServices namespace={namespace}/>
        </FlexBox>
    )
}

function ServiceCreatePanel(props) {
    const {name, setName, image, setImage, scale, setScale, size, setSize, cmd, setCmd, maxscale} = props

    return(
        <FlexBox className="col gap" style={{fontSize: "12px"}}>
                <FlexBox className="col gap">
                    <FlexBox className="col" style={{paddingRight:"10px"}}>
                        Name
                        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Enter name for service" />
                    </FlexBox>
                    <FlexBox className="col" style={{paddingRight:"10px"}}>
                        Image
                        <input value={image} onChange={(e)=>setImage(e.target.value)} placeholder="Enter an image name" />
                    </FlexBox>
                    <FlexBox className="col" style={{paddingRight:"10px"}}>
                        Scale
                        <input type="range" style={{paddingLeft:"0px"}} min={"0"} max={maxscale.toString()} value={scale.toString()} onChange={(e)=>setScale(e.target.value)} />
                    </FlexBox>
                    <FlexBox className="col" style={{paddingRight:"10px"}}>
                        Size
                        <input list="sizeMarks" style={{paddingLeft:"0px"}} type="range" min={"0"} value={size.toString()}  max={"2"} onChange={(e)=>setSize(e.target.value)}/>
                        <datalist style={{display:"flex", alignItems:'center'}} id="sizeMarks">
                            <option style={{flex:"auto", textAlign:"left", lineHeight:"10px"}} value="0" label="small"/>
                            <option style={{flex:"auto", textAlign:"center" , lineHeight:"10px"}} value="1" label="medium"/>
                            <option style={{flex:"auto", textAlign:"right", lineHeight:"10px" }} value="2" label="large"/>
                        </datalist>
                    </FlexBox>
                    <FlexBox className="col" style={{paddingRight:"10px"}}>
                        CMD
                        <input value={cmd} onChange={(e)=>setCmd(e.target.value)} placeholder="Enter the CMD for a service" />
                    </FlexBox>
                </FlexBox>
        </FlexBox>
    )
}

function NamespaceServices(props) {
    const {namespace} = props

    const [load, setLoad] = useState(true)
    const [serviceName, setServiceName] = useState("")
    const [image, setImage] = useState("")
    const [scale, setScale] = useState(0)
    const [size, setSize] = useState(0)
    const [cmd, setCmd] = useState("")

    const {data, err, config, getNamespaceConfig, createNamespaceService, deleteNamespaceService} = useNamespaceServices(Config.url, true, namespace)

    useEffect(()=>{
        async function getcfg() {
            await getNamespaceConfig()
            
        }
        if(load && config === null) {
            getcfg()
            setLoad(false)
        }
    },[config, getNamespaceConfig])



    if (err !== null) {
        // error happened with listing services
        console.log(err)
    }

    if(data === null) {
        return ""
    }

    return(
        <ContentPanel style={{width:"100%"}}>
        <ContentPanelTitle>
            <ContentPanelTitleIcon>
                <IoPlay/>
            </ContentPanelTitleIcon>
            <FlexBox>
                Namespace Services
            </FlexBox>
            <div>
            <Modal title="New namespace service" 
                escapeToCancel
                modalStyle={{
                    maxWidth: "300px"
                }}
                onOpen={() => {
                    console.log("ON OPEN");
                }}
                onClose={()=>{
                    setServiceName("")
                    setImage("")
                    setScale(0)
                    setSize(0)
                    setCmd("")
                }}
                button={(
                    <AddValueButton  label=" " />
                )}  
                keyDownActions={[
                    KeyDownDefinition("Enter", async () => {
                    }, true)
                ]}
                actionButtons={[
                    ButtonDefinition("Add", async () => {
                        let err = await createNamespaceService(serviceName, image, scale, size, cmd)
                        if(err) return err
                    }, "small blue", true, false),
                    ButtonDefinition("Cancel", () => {
                    }, "small light", true, false)
                ]}
            >
                {config !== null ? 
                    <ServiceCreatePanel cmd={cmd} setCmd={setCmd} size={size} setSize={setSize} name={serviceName} setName={setServiceName} image={image} setImage={setImage} scale={scale} setScale={setScale} maxscale={config.maxscale} />
                    :
                    ""
                }
            </Modal>
        </div>
        </ContentPanelTitle>
        <ContentPanelBody className="secrets-panel">
            <FlexBox className="gap col">
                <FlexBox className="col gap">
                    {
                        data.map((obj)=>{
                            return(
                                <Service 
                                    url={`/n/${namespace}/services/${obj.info.name}`} 
                                    deleteService={deleteNamespaceService} 
                                    conditions={obj.conditions} 
                                    name={obj.info.name} 
                                    status={obj.status} 
                                    image={obj.info.image} 
                                />
                            )
                        })
                    }
                </FlexBox>
            </FlexBox>
        </ContentPanelBody>
    </ContentPanel>

    )
}

export function Service(props) {
    const {name, image, status, conditions, deleteService, url, revision, dontDelete} = props

    return(
        <div className="col">
            <FlexBox style={{ height:"40px", border:"1px solid #f4f4f4", backgroundColor:"#fcfdfe"}}>
                <Link to={url} style={{ width: "100%", display: "flex", alignItems: "center" }}>
                    <FlexBox className="gap" style={{alignItems:"center", paddingLeft:"8px"}}>
                        <ServiceStatus status={status} />
                        <div style={{fontWeight:"bold"}}>
                            {name}
                        </div>
                        <div style={{fontStyle:"italic"}} className="grey-text">
                            {image}
                        </div>
                        {/* 
                        // Todo add contextually what is using this service
                        <div>
                            x
                        </div> */}
                    </FlexBox>
                </Link>
                {!dontDelete ? 
                <div style={{paddingRight:"25px", maxWidth:"20px", margin: "auto"}}>
                    <Modal  title="Delete namespace service" 
                        escapeToCancel
                        modalStyle={{
                            maxWidth: "300px"
                        }}
                        onOpen={() => {
                            console.log("ON OPEN");
                        }}
                        onClose={()=>{
                        }}
                        button={(
                            <ServicesDeleteButton />
                        )}  
                        actionButtons={[
                            ButtonDefinition("Delete", async () => {
                                if(revision !== undefined) {
                                    let err = await deleteService(revision)
                                    if (err) return err
                                }else {
                                    let err = await deleteService(name)
                                    if (err) return err
                                }
                             
                            }, "small red", true, false),
                            ButtonDefinition("Cancel", () => {
                            }, "small light", true, false)
                        ]}
                    >
                        <FlexBox className="col gap">
                            <FlexBox >
                                Are you sure you want to delete '{name}'?
                                <br/>
                                This action cannot be undone.
                            </FlexBox>
                        </FlexBox>
                    </Modal>
                </div>:""}
            </FlexBox>
            <FlexBox style={{border:"1px solid #f4f4f4", borderTop:"none"}}>
                <ServiceDetails conditions={conditions} />
            </FlexBox>
        </div>
    )
}

function ServiceDetails(props) {
    const {conditions} = props

    return(
        <ul style={{listStyle:"none", paddingLeft:"25px", paddingRight:"40px", width:"100%"}}>
            {conditions.map((obj)=>{
                return(
                    <Condition status={obj.status} name={obj.name} reason={obj.reason} message={obj.message}/>
                )
            })}

        </ul>
    )
}

function Condition(props){
    const {status, name, reason, message} = props

    const [showDetails, setShowDetails] = useState(false)

    let waitMsgClasses = "wait-message "
    let failMsgClasses = "fail-message "

    if (showDetails) {
        waitMsgClasses += "visible"
        failMsgClasses += "visible"
    }


    return(
        <li  style={{display:"flex", gap:"10px"}}>
        <div>
            <ServiceStatus status={status}/>
        </div>
        <FlexBox className="col gap" style={{marginBottom:"10px"}}>
            <FlexBox>
                <FlexBox>
                    {name}
                </FlexBox>
                {status !== 'True' && reason !== "" && message !== "" ? 
                    <FlexBox style={{justifyContent:"flex-end"}}>
                        {showDetails ? 
                            <div className="toggle-details" onClick={()=>setShowDetails(!showDetails)} style={{color:"#dbd9d9", display:"flex", alignItems:"center", fontSize:"10pt", cursor:"pointer"}}>
                                <IoChevronDownOutline /> 
                                <div>Hide Details</div>
                            </div>
                            :
                            <div className="toggle-details" onClick={()=>setShowDetails(!showDetails)} style={{color:"#dbd9d9", display:"flex", alignItems:"center", fontSize:"10pt", cursor:"pointer"}}>
                                <IoChevronForwardOutline /> 
                                <div>Show Details</div>
                            </div>
                        }
                    </FlexBox>
                    :
                    ""
                }
            </FlexBox>
            <>
            {status === 'Unknown' ?
                <div className={waitMsgClasses}>
            {reason !== ""  ? 
                <div className="grey-text" style={{fontSize:"10pt", fontStyle:"italic"}}>
                    {reason}
                </div>:""}
            {message !== "" ? 
                <div>
                    <div className="msg-box">
                        {message}
                    </div>
                </div>
                :
                ""
                }
            </div>:""}
            {status === 'False' ? 
                <div className={failMsgClasses} >
                    <div className="grey-text" style={{fontSize:"10pt", fontStyle:"italic"}}>
                        {reason}
                    </div>
                    <div>
                        <div className="msg-box"> 
                            {message}
                        </div>
                    </div>
                </div>
            :
            ""
            }
            </>
        </FlexBox>
    </li>
    )
}

export function ServiceStatus(props) {
    const {status} = props

    let color = "#66DE93"
    if (status === "False") {
        color = "#FF616D"
    }

    if (status === "Unknown") {
        color = "#082032"
    }

    return(
        <div>   
            <FaCircle style={{fontSize:"6pt", fill: color}} />
        </div>
    )
}

function ServicesDeleteButton(props) {
    const {onClick} = props

    return (
        <FlexBox onClick={onClick} className="col red-text" style={{height: "100%", textAlign:"right", width:"30px"}}>
            <div className="secrets-delete-btn" style={{height: "100%", display: "flex", paddingRight: "8px" }}>
                <RiDeleteBin2Line className="auto-margin" />
            </div>
        </FlexBox>
    )
}