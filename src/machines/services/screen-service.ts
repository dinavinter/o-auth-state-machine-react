import {showScreenSet} from "../../gigya/gigyaAuthMachine";
import {EventObject, InvokeMeta, Receiver, Sender, IndexByType, Values} from "xstate/lib/types";
import {  ScreenEvents, ScreenSetContext} from "../screenSetMachine";
import {AnyEventObject, EventType, Prop} from "xstate";


// export type ExtractPayload<TEvents extends {type:EventType}>  =Prop<Values<IndexByType<TEvents>>, "payload">
// export type ExtractPayload<Events extends { type: string, payload: any }> = {
//     [E in Events as E["type"]]: E["payload"]
// }

export type ExtractPayload<TEvents extends { type: string, payload:  any }> = TEvents extends { type: string, payload:  infer TPayload }? TPayload: never;
export type ExtractPayloadByType<TEvents extends { type: string, payload:  any }, Type extends keyof IndexByType<TEvents>> =
    TEvents extends { type: Type, payload:  infer TPayload }?  TPayload: never;

export type EventHandler<TEvent = any> = (e: TEvent) => void | boolean;

type EventConfig<Events extends { type: string, payload: any }> = {
    [E in Events as E["type"]]: { type: E["type"], payload: E["payload"] }
}



declare type EventSender = <Type extends keyof IndexByType<ScreenEvents>>(type: Type) => EventHandler<ExtractPayloadByType<ScreenEvents, Type>>

declare const _payloadClean: <TPayload extends ExtractPayload<ScreenEvents>, PayloadProps extends keyof TPayload= keyof TPayload> (event:TPayload) =>
    Partial<Pick<TPayload, PayloadProps >>;


const  payloadClean    = (payload:any)=> payload as ReturnType<typeof _payloadClean>  ;

function forwardEvent(sender: Sender<any>):
    <Type extends keyof IndexByType<ScreenEvents>, TPayload = ExtractPayloadByType<ScreenEvents, Type>>(type: Type) => EventHandler<TPayload> {
    return (type) => (event) => {
        sender({type: type, payload: payloadClean(event)});
        return true;
    }
}


export function screenSet(input: { start_screen: string, screen_set: string, container_id?: string }, forwarder: EventSender) {
    const {start_screen, screen_set, container_id} = input;
    showScreenSet({
        containerID: container_id,
        screenSet: screen_set,
        startScreen: start_screen,
        // onBeforeScreenLoad: forwarder(ScreenEvents.Before_Screen_Load),
        // onAfterScreenLoad: forwarder(ScreenEvents.After_Screen_Load),
        // onBeforeValidation: forwarder(ScreenEvents.Before-Validation),
        onAfterValidation: forwarder(ScreenEvents.After_Validation),
        onFieldChanged: forwarder(ScreenEvents.Field_Changed),
        // onSubmit: forwarder(ScreenEvents.Before_Submit),
        onAfterSubmit: forwarder(ScreenEvents.After_Submit),
        onError: forwarder(ScreenEvents.Error),
        onHide: forwarder(ScreenEvents.Hide)
    })
}

export function screenSetService<TContext extends ScreenSetContext = ScreenSetContext, TSourceEvent extends EventObject = AnyEventObject>(context: TContext, event: TSourceEvent, meta: InvokeMeta) {
    return (callback: Sender<ScreenEvents>, onReceive: Receiver<TSourceEvent>) => {
        const {input, data} = meta.src;
        const forwarder = forwardEvent(callback);
        console.log(meta);
        console.log(context);
        screenSet(input, forwarder)
    }
}