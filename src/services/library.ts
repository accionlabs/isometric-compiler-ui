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
            lastUpdated: library.updatedat,
            totalShapes: library.total_shapes
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

export async function createLibrary(payload : {
    name : string,
    desctiption: string,
    metadata?: any,
    type: "shapes" | "components"
  }): Promise<LibraryData> {
    const res = await fetcher<any, any>(`${config.gatewayApiUrl}/isometric/library`, 'post', payload, true, false);
    return {
        id: String(res.id),
        name: res.name,
        shapes: [],
        description: res.description,
        lastUpdated: res.updatedat,
        totalShapes: 0
    }
}

type ShapeReq = {
    name: string,
    description?: string,
    attachTo?: string,
    svgContent: string,
    type: '2D' | '3D'
}

export async function createBulkShapes(payload: {
    updateMode?: 'replace' | 'append',
    id?: string,
    name?: string,
    description?: string,
    shapes: ShapeReq[]
}): Promise<LibraryData> {
    const resp = await fetcher<any, any>(`${config.gatewayApiUrl}/isometric/createShapes`, 'post', payload, false, false);
    return {
        id: String(resp.libraryData.id),
        name: resp.libraryData.name,
        shapes: [],
        description: resp.libraryData.description,
        lastUpdated: resp.libraryData.updatedat,
        totalShapes: resp.shapeCount
    }
}