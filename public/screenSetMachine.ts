import {FormEvents, formMachine} from "./formMachine";
import gigyaWebSDK from "../gigya/gigyaWebSDK";
import {showScreenSet} from "../gigya/gigyaAuthMachine";
import {AnyEventObject, spawn} from "xstate";
import {flowMachine} from "../src/machines/flowMachine";
import {AnyService} from "../src/machines/dynamicMachine";
import {AnyStateMachine} from "xstate/lib/types";

declare type ScreenSetContext = {
    screenSet: string; startScreen: string; containerId?: string;
}


export const createScreenSetMachine = (screenSet: string, startScreen: string, containerId?: string) => formMachine<ScreenSetContext>(`${screenSet}_${startScreen}`)
    .withContext({
        screenSet: screenSet,
        startScreen: startScreen,
        containerId: containerId
    })
    .withConfig({
        services: {
            loader: (context, event) =>
                (callback, onReceive) => {
                    load(context, callback)
                }
        },


    });


function load(context: ScreenSetContext, callback: (event: AnyEventObject) => void) {
    showScreenSet({
        containerID: context.containerId,
        screenSet: context.screenSet,
        startScreen: context.startScreen,
        onAfterScreenLoad: (e) => callback({type: FormEvents.LOAD_SUCCESS, ...e}),
        onSubmit: (e) => callback({type: FormEvents.SUBMIT, ...e}),
        onAfterSubmit: (e) => callback({type: FormEvents.SUCCESS, ...e}),
        onError: (e) => callback({type: FormEvents.FAILURE, ...e}),
        onHide: (e) => callback({type: FormEvents.CANCEL, ...e}),
    })

}


export const profileScreen= createScreenSetMachine('Default-ProfileUpdate', 'gigya-update-profile-screen')
export default profileScreen;