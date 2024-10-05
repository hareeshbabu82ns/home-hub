"use server";

import config from "@/config";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import { Readable } from "stream";
import { ArchiveOrgFieldType, ArchiveOrgSearchResult } from "./types";

const csvWriter = createObjectCsvWriter({
  append: true,
  path: path.resolve(config.dataFolder, "project-chalam-downloaded-links.csv"),
  header: [
    { id: "title", title: "Title" },
    { id: "url", title: "URL" },
  ],
});
export async function downloadValidLinks({
  startLine = 1,
  length = 200,
}: {
  startLine?: number;
  length?: number;
}) {
  // read title and link from csv file
  const data = await fs.readFile(
    path.resolve(
      config.dataFolder,
      "project-chalam-telugu-books-collection.csv",
    ),
    "utf-8",
  );
  const downloadedLinksFile = await fs.readFile(
    path.resolve(config.dataFolder, "project-chalam-downloaded-links.csv"),
    "utf-8",
  );
  const downloadedLinks = downloadedLinksFile
    .split("\n")
    .map((line) => {
      const [, url] = line.split(",");
      return url;
    })
    .filter((link) => link);
  const links = data
    .split("\n")
    .map((line) => {
      const [title, url] = line.split(",");
      return { title, url };
    })
    .filter((link) => link.url)
    .splice(startLine, length);
  // .splice(1, 50);
  // return links;
  const validLinks = [];
  let fileIndex = startLine - 1;
  for (const link of links) {
    fileIndex++;
    const fileIndexStr = fileIndex.toString().padStart(5, "0");
    const title = `${fileIndexStr}-${link.title}`;
    if (downloadedLinks.includes(link.url)) {
      console.log(`Already downloaded: ${link.title}`);
      continue;
    }
    const res = await fetch(link.url);
    if (res.ok && res.headers.get("content-type") === "application/pdf") {
      // save the files to data folder
      // const file = await res.blob();
      // const buffer = await file.arrayBuffer();
      // await fs.writeFile(`data/${link.title}.pdf`, Buffer.from(buffer));

      await fileStreamDownload(link.url, title, "pdf", (progress) => {
        const progressRounded = Math.round(progress);
        if (progressRounded % 10 !== 0) return;
        console.log(`Downloading ${title}: ${progressRounded}%`);
      });

      await csvWriter.writeRecords([link]);
      validLinks.push(link);
    }
  }
  return validLinks;
}

export async function findDownloadLinksProjectChalam(
  url: string = "https://projectchalam.avilpage.com/",
  visitedUrls = new Set<string>(),
) {
  if (visitedUrls.has(url)) {
    return;
  }
  visitedUrls.add(url);

  try {
    const res = await fetch(url);
    const data = await res.text();
    const $ = cheerio.load(data);
    const links: { title: string; url: string }[] = [];

    const linkElements = $("a").get();
    for (const element of linkElements) {
      const link = $(element).attr("href");
      const title = $(element).text().trim();
      // fetch title from the sibling td element
      const titleFinal =
        title === "Download"
          ? $(element).parent().prev("td").text().trim()
          : title;

      if (link && isDownloadableFile(link)) {
        links.push({ title: titleFinal.replace(/,/g, "-"), url: link });
        // console.log(`Found download link: ${titleFinal} - ${link}`);
        // break;
      } else if (link && isInternalLink(link)) {
        const absoluteLink = new URL(link, url).href;
        const subLinks = await findDownloadLinksProjectChalam(
          absoluteLink,
          visitedUrls,
        );
        if (subLinks) links.push(...subLinks);
      }
    }

    await csvWriter.writeRecords(links);
    return links;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
  }
}

function adjustTitleToFileName(title: string): string {
  return (
    title
      // .replace(/[^a-zA-Z0-9\s-_\.]/g, '-') // Replace invalid characters with hyphen
      .replace(/[\s-_\.]/g, "-") // Replace invalid characters with hyphen
      .replace(/\s+/g, "-") // Replace spaces with hyphen
      .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
      .toLowerCase()
  );
}

function isDownloadableFile(link: string): boolean {
  return /\.(pdf|zip|rar|tar\.gz|docx?)$/i.test(link);
}

function isInternalLink(link: string): boolean {
  return !/^https?:\/\//i.test(link) || link.startsWith("/");
}

const downloadFolderPath = path.join(process.cwd(), "data");

// Utility function to download a file and save it to disk using streams
async function fileStreamDownload(
  url: string,
  title: string,
  ext: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  const filename = adjustTitleToFileName(title) + `.${ext}`;
  const response = await fetch(url);

  if (!response.ok || response?.body === null) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const totalBytes = Number(response.headers.get("content-length"));
  let downloadedBytes = 0;

  const writableStream = createWriteStream(
    path.join(downloadFolderPath, filename),
  );

  // Use readable stream to pipe the response data and track progress
  const readableStream = Readable.from(response.body as never);
  readableStream.on("data", (chunk: Buffer) => {
    downloadedBytes += chunk.length;
    const progress = (downloadedBytes / totalBytes) * 100;
    onProgress(progress);
  });

  // Pipe the readable stream into the writable stream
  return new Promise((resolve, reject) => {
    readableStream.pipe(writableStream);

    writableStream.on("finish", resolve);
    writableStream.on("error", reject);
  });
}
// // Example usage
// findDownloadLinks("https://example.com");

// Ref: https://archive.org/help/aboutsearch.htm
// Ref: https://archive.org/advancedsearch.php
// https://archive.org/services/search/v1/scrape?fields=title&q=collection%3Anasa&count=50&output=json
/*
  q:          the query (using the same query Lucene-like queries supported by Internet Archive Advanced Search.
  fields:     Metadata fields to return, comma delimited
  sorts:      Fields to sort on, comma delimited (if identifier is specified, it must be last)
  count:      Number of results to return (minimum of 100)
  cursor:     A cursor, if any (otherwise, search starts at the beginning)
  total_only: if this is set to true, then only the number of results is returned.
*/

interface ArchiveOrgSearchParams {
  q: string;
  fields?: ArchiveOrgFieldType[];
  sorts?: string;
  count: number;
  cursor?: string;
  total_only?: boolean;
}

export async function searchArchiveOrg({
  q,
  fields = [
    "identifier",
    "language",
    "title",
    "collection",
    "creator",
    "subject",
    "downloads",
    "format",
    "date",
  ],
  sorts,
  count = 100,
  cursor,
  total_only,
}: ArchiveOrgSearchParams) {
  const url = new URL("https://archive.org/services/search/v1/scrape");
  url.searchParams.set("q", q);
  url.searchParams.set("fields", fields.join(","));
  sorts && url.searchParams.set("sorts", sorts);
  url.searchParams.set("count", count.toString());
  if (cursor) url.searchParams.set("cursor", cursor);
  if (total_only) url.searchParams.set("total_only", "true");

  console.log("Fetching:", url.toString());
  const res = await fetch(url.toString());
  const json = await res.json();
  return json as ArchiveOrgSearchResult;
}
