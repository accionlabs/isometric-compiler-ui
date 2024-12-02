import fetcher from './request'
import { config } from '../config'
import { LibraryData, Shape } from '@/Types';
export async function getLibraries(): Promise<LibraryData[]> {
    const libraryRes: any[] = await fetcher(`${config.gatewayApiUrl}/isometric/library?status=active`, 'get', undefined, true)
    return libraryRes.map(library => {
        return {
            id: String(library.id),
            name: library.name,
            description: library.description,
            // shapes: Shape[];
            // spreadsheetUrl?: string;
            // folderUrl?: string;
            shapes: [],
            lastUpdated: library.updatedat
        }
    })
}

export async function getShapes(libraryIds?: string[]): Promise<Shape[]> {
    let query = '';
    if(libraryIds) {
        libraryIds.map(library => query = `${query}libraryIds=${library}&`)
        
    }
    const shapeResp: { shapes: any[] } = await fetcher(`${config.gatewayApiUrl}/isometric/shapes?${query}status=active`, 'get', undefined, true)
    const updatedShapes : Shape[] = shapeResp.shapes.map(x => {
        return {
            name: x.name,
            type: x.type,
            attachTo: x.attachto,
            svgFile: x.name,
            svgContent: x.svgcontent
        }
    });
    return updatedShapes
}