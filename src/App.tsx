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
import {AnyState, State} from "xstate";
import {Box, Container, Snackbar} from "@material-ui/core";
import {SnackbarContext, snackbarMachine} from "./machines/snackbarMachine";
import AlertBar from "./components/AlertBar";
import {withGigya} from "./machines/withGigya";
import {notificationMachine} from "./machines/notificationsMachine";
import NotificationsContainer from "./containers/NotificationsContainer";
import ProfileContainer from "./containers/ProfileContainer";
import EventsContainer from "./containers/ActionsContainer";
import {useInterpretWithLocalStorage} from "./machines/withLocalStorage";
import {spacing} from "@material-ui/system";
import SessionInfo from "./components/Session";
// const authMachineWithGigya= withGigya(authMachine);
// const state= stateLocalStorage.get();
const App = () => {


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
            <EventsContainer authService={authService}/>
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
                    <NotificationsContainer authService={authService} notificationsService={notificationService}/>
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
