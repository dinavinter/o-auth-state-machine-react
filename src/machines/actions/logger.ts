import {IndexByType} from "xstate/es/types";
import {  ScreenEvents} from "../screenSetMachine";
import { ExtractPayloadByType} from "../services/screen-service";

function logHandler  <Type extends keyof IndexByType<ScreenEvents>>(type: Type)  
{

    return < TPayload  = ExtractPayloadByType<ScreenEvents, Type>>(event:TPayload) => {

        log(JSON.stringify(event), type, 'Handler')
        return true;
    }
}
export function log(text: string, operation: string , title ='Log') {

    var backgroundColor = !operation ? "#00800033" : "#ff000033";
    console.info(
        `%c ${title} %c--> ` + text + "%c%s",
        `font-weight: bold; color: #333;background-color:${backgroundColor};`,
        "font-weight: normal;color:#aaa",
        "font-weight: bold;color:#f14668",
        operation ? " --> " + operation : ""
    );

}
