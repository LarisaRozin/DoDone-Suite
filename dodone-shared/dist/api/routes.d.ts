export declare const API_ROUTES: {
    auth: {
        login: string;
        register: string;
        logout: string;
        forgotPassword: string;
        resetPassword: string;
        sendPasswordResetEmail: string;
    };
    user: {
        get: (id: number) => string;
        create: string;
        update: string;
        delete: (id: number) => string;
    };
    notifications: {
        register: string;
        unregister: string;
    };
    grades: {
        getList: () => string;
    };
    taskGroups: {
        create: string;
        update: string;
        delete: (id: number) => string;
        get: (id: number) => string;
        getDetails: (id: number) => string;
        getPagedList: () => string;
        getPagedListDetails: () => string;
    };
    taskKinds: {
        create: string;
        update: string;
        delete: (id: number) => string;
        get: (id: number) => string;
        getDetails: (id: number) => string;
        getPagedList: () => string;
        getPagedListDetails: () => string;
    };
    taskCategories: {
        create: string;
        update: string;
        delete: (id: number) => string;
        get: (id: number) => string;
        getDetails: (id: number) => string;
        getPagedList: () => string;
        getPagedListDetails: () => string;
    };
    taskItems: {
        create: string;
        update: string;
        copy: (id: number) => string;
        archive: (id: number, archiving: boolean) => string;
        archiveList: (archiving: boolean) => string;
        pin: (id: number, pinning: boolean) => string;
        pinList: (pinning: boolean) => string;
        setActive: (id: number, activating: boolean) => string;
        setActiveList: (activating: boolean) => string;
        setComplete: (id: number, completing: boolean) => string;
        setCompleteList: (completing: boolean) => string;
        delete: (id: number) => string;
        get: (id: number) => string;
        getDetails: (id: number) => string;
    };
};
