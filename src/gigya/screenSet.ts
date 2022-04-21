export declare type ScreenRequest = {
    containerId?: string,
    // container: Container<GigyaScreenState>,
    screenSet: string,
    startScreen: string
    onAfterSubmit?: AfterSubmitCallback
    onScreenLoaded?: OnAfterScreenLoadCallback
    onBeforeScreenLoaded?: OnBeforeScreenLoadCallback
    onBeforeSubmit?: OnBeforeSubmitCallback
    onSubmit?: OnSubmitCallback
     onError?: OnErrorCallback

}

export declare type AfterSubmitCallback = {
    <IAfterSubmitEvent = any>(details: IAfterSubmitEvent): void;
}

export declare type OnBeforeSubmitCallback = {
    <IBeforeSubmitEvent = any>(details: IBeforeSubmitEvent): void;
}


export declare type OnBeforeScreenLoadCallback = {
    <IBeforeScreenLoadEvent = any>(details: IBeforeScreenLoadEvent): void;
}


export declare type OnSubmitCallback = {
    <IOnSubmitEvent = any>(details: IOnSubmitEvent): void;
}

export declare type OnErrorCallback = {
    <IOnErrorEvent = any>(details: IOnErrorEvent): void;
}


export declare type OnAfterScreenLoadCallback = {
    <IAfterScreenLoadEvent = any>(details: IAfterScreenLoadEvent): void;
}

export declare type OnHideCallback = {
    <IHideEvent = any>(details: IHideEvent): void;
}

export declare type OnBeforeValidationCallback = {
    <IHideEvent = any>(details: IHideEvent): void;
}