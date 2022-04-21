import {isEmpty, omit} from "lodash/fp";
import {NotificationResponseItem} from "../models";
import {actions, createMachine, InterpreterFrom, MachineConfig} from "xstate";
import {snackbarMachine} from "./snackbarMachine";
const {assign} = actions;
export interface NotificationsSchema {

    states: {
        visible: {};
    };
}

export type NotificationsEvents = NotificationsAddEvent | { type: "HIDE" };
export type NotificationsAddEvent = { type: "ADD", notification: NotificationResponseItem } 


export interface NotificationsContext {
    notifications: Array<NotificationResponseItem>

}

export const notificationsMachineConfig: MachineConfig<NotificationsContext, NotificationsSchema, NotificationsEvents> = {
    context: {
        notifications: Array.of<NotificationResponseItem>()
    },
    initial: "visible",
    states: {
        visible: {
            on: {
                'ADD': {
                    actions: "addNotification"
                }
            }
        }
    }
};


export const notificationMachine= createMachine(notificationsMachineConfig, {
    actions: {
        addNotification:  assign({
            notifications: (context, event:NotificationsAddEvent, meta)=> [...context.notifications , event.notification]
        })
    }
})

export type NotificationsService = InterpreterFrom<typeof notificationMachine>
