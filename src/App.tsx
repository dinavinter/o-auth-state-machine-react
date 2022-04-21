// import logo from "./logo.svg";
import React, {useEffect} from "react";
import "./App.css";
import "./styles/globals.css";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Profile from "./components/Profile";
// import {useActor} from "@xstate/react";
import {authMachine, AuthService} from "./machines/authMachine";
import {Redirect, RouteComponentProps, Router, useNavigate} from "@reach/router";
import {useActor, useInterpret, useMachine, useSelector} from "@xstate/react";
import {history} from "./utils/historyUtils";
import {AnyEventObject, AnyState, State, StateFrom} from "xstate";
import {AppBar, Box, Container, Snackbar} from "@material-ui/core";
import {SnackbarContext, snackbarMachine} from "./machines/snackbarMachine";
import AlertBar from "./components/AlertBar";
import {withGigya} from "./machines/withGigya";
import {notificationMachine, NotificationsEvents} from "./machines/notificationsMachine";
import NotificationsContainer from "./containers/NotificationsContainer";
import ProfileContainer from "./containers/ProfileContainer";
import EventsContainer from "./containers/ActionsContainer";
import {useInterpretWithLocalStorage} from "./machines/withLocalStorage";
import {spacing} from "@material-ui/system";
import SessionInfo from "./components/Session";
import {machineLoader} from "./machines/dynamicMachine";
import {profileScreen} from "./machines/screenSetMachine";
import {AnyMachine} from "./machines/request";
import {AnyInterpreter} from "xstate/lib/types";
import {Sender} from "xstate/es";
import {generateUniqueID} from "web-vitals/dist/modules/lib/generateUniqueID";
// const authMachineWithGigya= withGigya(authMachine);
// const state= stateLocalStorage.get();

import {omit} from "lodash/fp";

function dispatcherSelector(state: StateFrom<typeof profileScreen>) {
    return state.context.dispatcher;
    
}

function spyServiceEvents(service: AnyInterpreter, sender: Sender<NotificationsEvents> ){
    function getPayload(event: AnyEventObject) {
        return event.data || omit("type", event);
    }

    service.onEvent(event => {
            const payload = getPayload(event);


            sender({
                type: "ADD", notification: {
                    id: generateUniqueID(),
                    title: event.type,
                    severity: event.type == "error." ? "error":"info",
                    payload: payload
                }
            })
        })
}

const App = () => {


    // const [profileState, sendProfile, profileService] = useMachine(()=> machineLoader.withContext({
    //         machineUrl: './machines/screenSetMachine'
    //     })
    // );
    const [profileState, sendProfile, profileService] = useMachine(() => profileScreen);
    // const [dispatcherState, sendDispatcher] = useActor( profileState.context?.dispatcher);

    const authService = useInterpretWithLocalStorage(() => withGigya(authMachine));
    // const [,sendAuth , authService] = useMachine(()=>withGigya(authMachine));
    //
    //  const [, , authService] = useMachine(authMachineWithGigya, {
    //      state: state
    //   });

    const [, sendSnackbar, snackbarService] = useMachine(snackbarMachine);
    const [, sendNotification, notificationService] = useMachine(notificationMachine);

    const showSnackbar = (payload: SnackbarContext) => sendSnackbar({type: "SHOW", ...payload});

    // authService.subscribe(state => {
    //     showSnackbar({message: state.value as string, severity: "info" })
    // })
    
    const dispatcherMachine = useSelector(profileService, dispatcherSelector);
    const [dispatcherState, sendDispatcher, dispatcherService] = useMachine(()=>dispatcherMachine);
     
     useEffect(() => {
        const subscription = profileService.subscribe((state: AnyState) => {
            // simple state logging
            console.log(state);
            showSnackbar({message: state.value.toString(), severity: "info"})

            
        });

        return subscription.unsubscribe;
    }, [profileService]); 
    
    useEffect(() => {
        spyServiceEvents(dispatcherService, sendNotification);
        console.log(dispatcherMachine?.id);
        console.log(dispatcherService);
        if(dispatcherService){
 
            const subscription = dispatcherService.subscribe((state: AnyState) => {
                // simple state logging
                console.log(state);
                showSnackbar({message: state.value.toString(), severity: "info"})
                sendNotification({type:"ADD" ,notification: {
                        id: generateUniqueID(),
                        title: state.value.toString(),
                        severity: "info",
                        payload: state.value
                    }});


            });

            return subscription.unsubscribe;
        }
       
    }, [dispatcherService]);
    
    useEffect(() => {
        const subscription = authService.subscribe((state: AnyState) => {
            // simple state logging
            console.log(state);
            showSnackbar({message: state.value.toString(), severity: "info"})

        });

        return subscription.unsubscribe;
    }, [authService]);

    // @ts-ignore
    // @ts-ignore
    return (
        <div>
            <AppBar color="transparent" variant={"outlined"}>
                <EventsContainer service={authService}/>
                <EventsContainer service={profileService}/>

            </AppBar>
            
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'none',
                    m: 20,

                    alignItems: "left"
                }}
            >
                <Box>

                    <Router>
                        <PrivateRoute default as={ProfileContainer} path={"/"} authService={authService}/>
                        <SignIn path={"/signin"} authService={authService}/>
                        <ProfileContainer path="/profile" authService={authService}/>

                    </Router>
                </Box>

                <Container fixed maxWidth="sm">
                    <NotificationsContainer service={authService} notificationsService={notificationService}/>
                    <NotificationsContainer service={profileService} notificationsService={notificationService}/>
                </Container>
            </Box>


            <AlertBar snackbarService={snackbarService}/>

        </div>
    );
};

export interface Props extends RouteComponentProps {
    authService: AuthService;
    as: any;


}

function LoginRoute({authService}: { authService: AuthService }) {
    const [state] = useActor(authService)
    switch (true) {
        case state.matches('login.signup'):
            return <SignUp authService={authService}/>
        default:
            return <SignIn authService={authService}/>
    }


}

function PrivateRoute({authService, as: Comp, ...props}: Props) {
    const [state, send] = useActor(authService);
    useEffect(() => {
        if (state.matches('unauthorized')) {
            send('LOGIN')
        }
    }, [state]);

    switch (true) {
        case state == undefined:
            return <LoginRoute authService={authService}/>;

        case state.matches('login'):
            return <LoginRoute authService={authService}/>

        case state.matches('reauth'):
            return <SignIn authService={authService}/>
        default:
            return <Comp {...props} authService={authService}/>;
    }


}


export default App;
