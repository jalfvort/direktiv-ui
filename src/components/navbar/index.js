import React, {useState} from 'react';
import './style.css';
import Logo from '../../assets/nav-logo.png'
import FlexBox from '../flexbox';
import NamespaceSelector from '../namespace-selector';

import Modal from '../modal';
import { ButtonDefinition } from '../modal';
import {BsSpeedometer, BsFolder2Open, BsSliders, BsCodeSquare} from 'react-icons/bs';
import {IoGitNetworkOutline, IoLockClosedOutline, IoCubeOutline, IoExtensionPuzzleOutline, IoGlobeOutline, IoLogOutOutline} from 'react-icons/io5';
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';

function NavBar(props) {

    let {onClick, style, className, createNamespace, namespace, namespaces, createErr} = props;

    if (!className) {
        className = ""
    }

    className = "navigation-master " + className

    let loading = false;
    if (!namespace) {
        loading = true;
        className += " loading"
    }
    
    return (
        <FlexBox onClick={onClick} style={{...style}} className={className}>
            <FlexBox className="col tall" style={{ gap: "12px" }}>
                <FlexBox className="navbar-logo">
                    <img alt="logo" src={Logo} />
                </FlexBox>
                <div className="navbar-panel shadow col">
                    <FlexBox>
                        <NamespaceSelector namespace={namespace} namespaces={namespaces}/>
                    </FlexBox>
                    <FlexBox>
                        <NewNamespaceBtn createErr={createErr} createNamespace={createNamespace} />
                    </FlexBox>
                    <NavItems namespace={namespace} style={{ marginTop: "12px" }} />
                </div>

                <div className="navbar-panel shadow col">
                    <GlobalNavItems />
                </div>

                <FlexBox>
                    <FlexBox className="nav-items" style={{ paddingLeft: "10px" }}>
                        <ul style={{ marginTop: "0px" }}>
                            <li>
                                <NavItem className="red-text" label="Log Out">
                                    <IoLogOutOutline/>
                                </NavItem>
                            </li>
                        </ul>
                    </FlexBox>
                </FlexBox>

                <FlexBox className="col navbar-userinfo">
                    <FlexBox className="navbar-username">
                        UserName007
                    </FlexBox>
                    <FlexBox className="navbar-version">
                        Version: 0.5.8 (abdgdj)
                    </FlexBox>
                </FlexBox>

            </FlexBox>
        </FlexBox>
    );
}

export default NavBar;

function NewNamespaceBtn(props) {
    const {createNamespace, createErr} = props

    // createErr is filled when someone tries to create namespace but proceeded to error out


    const [ns, setNs] = useState("")
    const navigate = useNavigate()

    return (
        <Modal title="New namespace" 
            escapeToCancel
            button={(
                <FlexBox className="new-namespace-btn">
                    <div className="auto-margin">
                        <FlexBox className="row" style={{ gap: "8px" }}>
                            <FlexBox>
                                +
                            </FlexBox>
                            <FlexBox>
                                New namespace
                            </FlexBox>
                        </FlexBox>
                    </div>
                </FlexBox>
            )} 
            actionButtons={[
                ButtonDefinition("Add", async () => {
                    await createNamespace(ns)
                    setTimeout(()=>{
                        navigate(`/n/${ns}`)
                    },200)
                    setNs("")
                }, "small blue", true, false),
                ButtonDefinition("Cancel", () => {
                    console.log("close modal");
                    setNs("")
                }, "small light", true, false)
            ]}
        >
            <FlexBox>
                <input autoFocus value={ns} onChange={(e)=>setNs(e.target.value)} placeholder="Enter namespace name" />
            </FlexBox>
        </Modal>
    );
}

function NavItems(props) {

    let {style, namespace} = props;

    const {pathname} = useLocation()

    let explorer = matchPath("/n/:namespace", pathname)
    let monitoring = matchPath("/n/:namespace/monitoring", pathname)
    let builder = matchPath("/n/:namespace/builder", pathname)
    let events = matchPath("/n/:namespace/events", pathname)
    let instances = matchPath("/n/:namespace/instances", pathname)
    let permissions = matchPath("/n/:namespaces/permissions", pathname)
    let services = matchPath("/n/:namespace/services", pathname)
    let settings = matchPath("/n/:namespace/settings", pathname)


    return (
        <FlexBox style={{...style}} className="nav-items">
            <ul>
                <li>
                    <Link to={`/n/${namespace}`}>
                        <NavItem className={explorer ? "active":""} label="Explorer">
                            <BsFolder2Open/>
                        </NavItem>
                    </Link>
                </li>
                <li>
                    <Link to={`/n/${namespace}/monitoring`}>
                        <NavItem className={monitoring ? "active":""} label="Monitoring">
                            <BsSpeedometer/>
                        </NavItem>
                    </Link>
                </li>
                <li>
                    <Link to={`/n/${namespace}/builder`}>
                        <NavItem className={builder ? "active":""} label="Workflow Builder">
                            <IoGitNetworkOutline/>
                        </NavItem>
                    </Link>
                </li>
                <li>
                    <Link to={`/n/${namespace}/instances`}>
                        <NavItem className={instances ? "active":""} label="Instances">
                            <BsCodeSquare/>
                        </NavItem>
                    </Link>
                </li>
                <li>
                    <Link to={`/n/${namespace}/events`}>
                        <NavItem className={events ? "active":""} label="Events">
                            <BsCodeSquare/>
                        </NavItem>
                    </Link>
                </li>
                <li>
                    <Link to={`/n/${namespace}/permissions`}>
                        <NavItem className={permissions ? "active":""} label="Permissions">
                            <IoLockClosedOutline/>
                        </NavItem>
                    </Link>
                </li>
                <li>
                    <Link to={`/n/${namespace}/services`}>
                        <NavItem className={services ? "active":""} label="Services">
                            <IoCubeOutline/>
                        </NavItem>
                    </Link>
                </li>
                <li>
                    <Link to={`/n/${namespace}/settings`}>
                        <NavItem className={settings ? "active":""} label="Settings">
                            <BsSliders/>
                        </NavItem>
                    </Link>
                </li>
            </ul>
        </FlexBox>
    );
}

function GlobalNavItems(props) {

    const {pathname} = useLocation()

    let jq = matchPath("/jq", pathname)
    let gs = matchPath("/g/services", pathname)
    let gr = matchPath("/g/registries", pathname)

    return (
        <FlexBox className="nav-items">
            <ul>
                <li style={{marginTop: "0px"}}>
                    <Link  to={"/jq"}>
                        <NavItem className={jq ? "active":""} label="jq Playground">
                            <IoExtensionPuzzleOutline/>
                        </NavItem>
                    </Link>
                </li>
                <li>
                    <Link to={"/g/services"}>
                        <NavItem className={gs ? "active":""} label="Global Services">
                            <IoGlobeOutline/>
                        </NavItem>
                    </Link>
                </li>
                <li>
                    <Link to={"/g/registries"}>
                        <NavItem className={gr ? "active":""} label="Global Registries">
                            <IoGlobeOutline/>
                        </NavItem>
                    </Link>
                </li>
            </ul>
        </FlexBox>
    );
}

function NavItem(props) {

    let {children, label, className, active} = props;
    if (!className) {
        className = ""
    }

    return (
            <FlexBox className={"nav-item " + className} style={{ gap: "8px" }}>
                <FlexBox style={{ maxWidth: "30px", width: "30px", margin: "auto" }}>
                    {children}
                </FlexBox>
                <FlexBox style={{ textAlign: "left" }}>
                    {label}
                </FlexBox>
            </FlexBox>
    );
}