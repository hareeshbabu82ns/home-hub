"use client";

import { useMutation } from "@tanstack/react-query";
import { downloadValidLinks } from "./actions";
// import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const ScrapeWebPage = () => {
  const [data, setData] = useState(null);
  const [startLine, setStartLine] = useState(100);
  const [length, setLength] = useState(500);
  const {
    mutate: performAction,
    error,
    isPending,
  } = useMutation({
    mutationKey: ["download-links", startLine, length],
    mutationFn: async () => {
      return await downloadValidLinks({ startLine, length });
    },
  });

  // if (isPending) {
  //   return <Loader />;
  // }
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4">
        <Input
          placeholder="Enter Start Line"
          type="number"
          value={startLine}
          onChange={(e) => setStartLine(e.target.valueAsNumber)}
          disabled={isPending}
        />
        <Input
          placeholder="Enter Length"
          type="number"
          value={length}
          onChange={(e) => setLength(e.target.valueAsNumber)}
          disabled={isPending}
        />
        <Button
          onClick={() => {
            performAction(undefined, {
              onSuccess: (data) => setData(data as never),
            });
          }}
          disabled={isPending}
        >
          Download
        </Button>
      </div>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default ScrapeWebPage;
