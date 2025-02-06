import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const mergeAndMapItems = <T extends Record<string, any>>(
    array1: T[],
    array2: T[],
    key: keyof T
): { items: T[]; namesMap: Record<string, any> } => {
    // Combine both arrays
    const combined = [...array1, ...array2];

    // Create a map to store unique items based on the dynamic key
    const uniqueItemsMap = new Map<any, T>();

    // Create an object to store the names
    const namesObject: Record<string, any> = {};

    // Iterate over the combined array
    for (const item of combined) {
        // Add the item to the map if the key is unique
        uniqueItemsMap.set(item[key], item);

        // Collect names into the namesObject
        if (item[key]) {
            namesObject[item[key]] = item;
        }
    }

    // Convert the map back to an array
    const itemsArray = Array.from(uniqueItemsMap.values());

    // Return the items array and the names object
    return { items: itemsArray, namesMap: namesObject };
};

export const throttle = (func: Function, limit: number) => {
    let lastFunc: NodeJS.Timeout;
    let lastRan: number;

    return function (this: any, ...args: any[]) {
        // Explicitly type 'this'
        const context = this; // Store the 'this' context
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function () {
                if (Date.now() - lastRan >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
};
