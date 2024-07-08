import fs, { Stats } from "fs";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { ReadableOptions } from "stream";

export const dynamic = 'force-dynamic' // defaults to auto

/**
 * Return a stream from the disk
 * @param {string} path - The location of the file 
 * @param {ReadableOptions} options - The streamable options for the stream (ie how big are the chunks, start, end, etc).
 * @returns {ReadableStream} A readable stream of the file
 */
function streamFile(path, options) {
    const downloadStream = fs.createReadStream(path, options);

    return new ReadableStream({
        start(controller) {
            downloadStream.on("data", (chunk) => controller.enqueue(new Uint8Array(chunk)));
            downloadStream.on("end", () => controller.close());
            downloadStream.on("error", (error) => controller.error(error));
        },
        cancel() {
            downloadStream.destroy();
        },
    });
}


export async function GET(request,{ params }) {
    const root= '/opt/images';
    const fileName = `${root}/${params.slug}.jpg`;
    if(!fs.existsSync(fileName)) return notFound();

    const stats = await fs.promises.stat(fileName);                              // Get the file size
    const data = streamFile(fileName);                      // Stream the file with a 1kb chunk
    const res = new NextResponse(data, {                                            // Create a new NextResponse for the file with the given stream from the disk
        status: 200,                                                                    //STATUS 200: HTTP - Ok
        headers: new Headers({                                                          //Headers
//            "content-disposition": `attachment; filename=${path.basename(file)}`,           //State that this is a file attachment
            "content-type": "image/jpeg",                                              //Set the file type to an iso
            "content-length": stats.size + "",                                              //State the file size
        }),
    });

    return res;  
}