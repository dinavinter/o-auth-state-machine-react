import React, {useEffect} from "react";
import {AnyEventObject, Interpreter} from "xstate";
import {makeStyles, Paper, Typography} from "@material-ui/core";
import {NotificationUpdatePayload} from "../models";
import NotificationList from "../components/NotificationList";
import {AuthService} from "../machines/authMachine";
import {NotificationsService} from "../machines/notificationsMachine";
import {omit} from "lodash/fp";
import {useActor} from "@xstate/react";
import {generateUniqueID} from "web-vitals/dist/modules/lib/generateUniqueID";

const useStyles = makeStyles((theme) => ({
    paper: {
        minHeight: "90vh",
        padding: theme.spacing(2),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
    },
}));

export interface Props {
    authService: AuthService;
    notificationsService: NotificationsService;
}

const NotificationsContainer: React.FC<Props> = ({authService, notificationsService}) => {
    const classes = useStyles();
    // const [authState] = useActor(authService);
    const [notificationsState, sendNotifications] = useActor(notificationsService);

    function getPayload(event: AnyEventObject) {
       return event.data || omit("type", event);
    }

    useEffect(() => {
        authService.onEvent(event => {
            const payload = getPayload(event);

            sendNotifications({
                type: "ADD", notification: {
                    id: generateUniqueID(),
                    title: event.type,
                    severity: "info",
                    payload: payload
                }
            })
        })
    }, [authService])

    // useEffect(() => {
    //   sendNotifications({
    //     type: "ADD", notification: {
    //       id: "Auth State",
    //       title: authState.value as string,
    //       severity:  "info",
    //       payload: authState
    //     }
    //   })
    // }, [authState]);


    const updateNotification = (payload: NotificationUpdatePayload) => {
    };

    return (
        <Paper className={classes.paper} >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Notifications
            </Typography>
            <NotificationList
                notifications={notificationsState?.context?.notifications!}
                updateNotification={updateNotification}
            />
        </Paper>
    );
};

export default NotificationsContainer;
