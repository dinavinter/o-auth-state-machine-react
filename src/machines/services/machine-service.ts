import {dynamic, DynamicMachine} from "../dynamicMachine";
import {AnyMachine} from "../request";
import {isPromiseLike} from "xstate/es/utils";

declare type MachineCreator<TContext = any, TEvent = any> = (context: TContext, event: TEvent) => AnyMachine | PromiseLike<AnyMachine>;
declare type InferContext<TCreator extends MachineCreator> = TCreator extends MachineCreator<infer TContext, any> ? TContext : never;
declare type InferMachine<TCreator extends MachineCreator> = DynamicMachine<InferContext<TCreator>>;

// declare type DynamicMachineService<TCreator extends MachineCreator = MachineCreator> =(creator:TCreator)=>InferMachine<TCreator>;
declare function dynamicMachineService<TCreator extends MachineCreator = MachineCreator>(creator: TCreator): InferMachine<TCreator>;

declare type DynamicMachineService = typeof dynamicMachineService


export const machineService: DynamicMachineService = <TCreator extends MachineCreator>(creator: TCreator) => dynamic<InferContext<TCreator>>().withConfig({
    services: {
        load: (context, event):PromiseLike<AnyMachine> => {
            console.log(context);
            // console.log(src);
            const machine = creator(context, event);
            console.log(machine);

            return isPromiseLike(machine) ? machine : Promise.resolve(machine)
        }
    }
})