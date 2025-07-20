"use client";

import { useState } from "react";
import { searchArchiveOrg } from "../scrap-web/actions";
import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/loader";
import type { ArchiveOrgSearchResult } from "../scrap-web/types";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useDebouncedCallback from "@/lib/hooks/useDebouncedCallback";

// https://archive.org/services/search/v1/scrape?fields=title,language,date,format,subject,collection&q=(language:tel OR language:"Telugu") AND collection:"digitallibraryindia"&count=100
// total: 18221
// https://archive.org/services/search/v1/scrape?fields=title,language,date,format,subject,collection&q=(language:tel OR language:"Telugu") AND mediatype:"audio"&count=100
// total: 2478
// https://archive.org/services/search/v1/scrape?fields=title,language,date,format,subject,collection&q=(language:san OR language:"Sanskrit") AND collection:"digitallibraryindia"&count=100
// total: 54496
// https://archive.org/services/search/v1/scrape?fields=title,language,date,format,subject,collection&q=(language:san OR language:"Sanskrit") AND mediatype:"audio"&count=100
// total: 1361
const ArchiveOrgPage = () => {
  const [query, setQuery] = useState(
    // '(language:san OR language:"Sanskrit") AND mediatype:"audio" AND ramayanam',
    // 'creator:"Digital Library Of India"' / 'collection:"digitallibraryindia"'
    // '(language:san OR language:"Sanskrit" or language:tel OR language:"Telugu") AND collection:"JaiGyan"', // from bharath ek khoj
    // 'creator:"Gita Press Gorakhpur"',
    // 'subject:"IIIT"',
    '(language:san OR language:"Sanskrit") AND collection:"digitallibraryindia" AND veda',
  );
  const debouncedQuery = useDebouncedCallback(setQuery, 1000);

  const { data, error, isFetching, isPending } = useQuery({
    queryKey: ["archive-org", query],
    queryFn: async () => {
      return await searchArchiveOrg({ q: query, count: 100 });
    },
    enabled: query.length > 0,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Input
          type="text"
          placeholder="Enter Query"
          defaultValue={query}
          onChange={(e) => debouncedQuery(e.target.value as never)}
        />
      </div>
      {(isFetching || isPending) && <Loader />}
      {error && <div>Error: {error.message}</div>}
      {data && <ArchiveOrgResults data={data} />}
    </div>
  );
};

const ArchiveOrgResults = ({ data }: { data: ArchiveOrgSearchResult }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">Total: {data.total}</div>
      <div className="grid grid-cols-3 gap-4">
        {data.items.map((item) => {
          const formatStr = item.format?.join(", ");
          return (
            <Card key={item.identifier} className="flex flex-col">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>
                  {item.identifier} ({item.language})
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                {/* <CardDescription className="text-clip">
                {item.subject}
              </CardDescription> */}
                {/* <CardDescription>{item.collection?.join(", ")}</CardDescription> */}
                {/* <CardDescription>{item.date}</CardDescription> */}
                <CardDescription>By: {item.creator}</CardDescription>
                {/* <CardDescription>{item.downloads}</CardDescription> */}
              </CardContent>

              <CardFooter className="justify-evenly">
                {formatStr?.includes("PDF") && (
                  <CardDescription>PDF</CardDescription>
                )}
                {formatStr?.includes("EPUB") && (
                  <CardDescription>EPUB</CardDescription>
                )}
                {formatStr?.includes("MP3") && (
                  <CardDescription>MP3</CardDescription>
                )}
                {/* {formatStr} */}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ArchiveOrgPage;
