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
import {AnyService} from "../machines/dynamicMachine";
import {AnyInterpreter} from "xstate/lib/types";

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
    service: AnyInterpreter;
    notificationsService: NotificationsService;
}

const NotificationsContainer: React.FC<Props> = ({service, notificationsService}) => {
    const classes = useStyles();
    // const [authState] = useActor(authService);
    const [notificationsState, sendNotifications] = useActor(notificationsService);

    function getPayload(event: AnyEventObject) {
       return event.data || omit("type", event);
    }

    useEffect(() => {
        service.onEvent(event => {
            const payload = getPayload(event);

           
            sendNotifications({
                type: "ADD", notification: {
                    id: generateUniqueID(),
                    title: event.type,
                    severity: event.type == "error." ? "error":"info",
                    payload: payload
                }
            })
        })
    }, [service])

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
